import { Payment } from '../models/Payment.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentReceipt } from '../models/PaymentReceipt.js';
import { Refund } from '../models/Refund.js';
import { FeeVoucher } from '../models/FeeVoucher.js';
import { StudentFee } from '../models/StudentFee.js';
import { Student } from '../models/Student.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateCode } from '../utils/idGenerator.js';
import {
  renderPaymentQrDataUrl,
  verifyPaymentWebhookSignature,
  reconcileSettledTransaction,
  recordFailedTransaction,
} from '../services/paymentService.js';
import { streamPaymentReceiptPdf } from '../services/pdfFinanceService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * POST /api/v1/payments/checkout
 * Student initiates a payment session for an unpaid/overdue voucher.
 * Never marks the voucher as paid — waits for verified webhook reconciliation.
 */
export const initiateCheckout = catchAsync(async (req, res, next) => {
  const { voucherId, paymentMethod, gatewayProvider } = req.body;

  const student = await Student.findOne({ userId: req.user._id }).lean();
  if (!student) return next(new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND'));

  const voucher = await FeeVoucher.findById(voucherId);
  if (!voucher) return next(new AppError('Fee voucher not found.', 404, 'VOUCHER_NOT_FOUND'));

  if (!voucher.studentId.equals(student._id)) {
    return next(
      new AppError('Access denied. You can only pay your own fee vouchers.', 403, 'FORBIDDEN_OWNER')
    );
  }

  if (voucher.status === 'paid') {
    return next(new AppError('This voucher is already paid.', 409, 'VOUCHER_ALREADY_PAID'));
  }

  const remainingAmount = Math.max(0, voucher.totalPayable - voucher.paidAmount);
  if (remainingAmount <= 0) {
    return next(new AppError('No remaining balance on this voucher.', 400, 'ZERO_BALANCE'));
  }

  const payment = await Payment.create({
    voucherId: voucher._id,
    studentId: student._id,
    amountPaid: remainingAmount,
    paymentMethod,
    status: 'pending',
  });

  const gatewayTransactionId = generateCode('TXN');
  await PaymentTransaction.create({
    paymentId: payment._id,
    voucherId: voucher._id,
    gatewayTransactionId,
    gatewayProvider,
    transactionStatus: 'initiated',
  });

  const qrDataUrl = await renderPaymentQrDataUrl(voucher.qrPayloadString);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Payment checkout initiated. Scan QR or complete gateway payment.',
    data: {
      paymentId: payment._id,
      gatewayTransactionId,
      gatewayProvider,
      amountDue: remainingAmount,
      paymentReference: voucher.paymentReference,
      qrDataUrl,
    },
  });
});

/**
 * POST /api/v1/payment-webhooks
 * Receives signed provider callbacks, verifies HMAC-SHA256 signature, and
 * idempotently reconciles settled or failed transactions.
 */
export const handlePaymentWebhook = catchAsync(async (req, res, next) => {
  const signature = req.headers['x-osquare-signature'];
  const isValid = verifyPaymentWebhookSignature(req.body, signature);

  if (!isValid) {
    await recordAuditLog({
      req,
      action: 'PAYMENT_WEBHOOK_SIGNATURE_INVALID',
      targetEntity: 'PaymentTransaction',
      status: 'failure',
      metadata: { provider: req.body?.gatewayProvider },
    });
    return next(new AppError('Invalid webhook signature.', 401, 'INVALID_WEBHOOK_SIGNATURE'));
  }

  const { paymentId, gatewayTransactionId, gatewayProvider, status, amountSettled } = req.body;

  if (status === 'settled') {
    const result = await reconcileSettledTransaction({
      paymentId,
      gatewayTransactionId,
      gatewayProvider,
      amountSettled: Number(amountSettled),
      rawPayload: req.body,
      signatureVerified: true,
    });

    await recordAuditLog({
      req,
      action: result.alreadyProcessed
        ? 'PAYMENT_WEBHOOK_DUPLICATE_IGNORED'
        : 'PAYMENT_RECONCILED',
      targetEntity: 'Payment',
      targetEntityId: paymentId,
      metadata: { gatewayTransactionId, gatewayProvider, alreadyProcessed: result.alreadyProcessed },
    });

    return sendSuccess(res, {
      message: result.alreadyProcessed
        ? 'Duplicate webhook ignored (idempotent).'
        : 'Payment verified and reconciled.',
      data: {
        alreadyProcessed: result.alreadyProcessed,
        receiptNumber: result.receipt?.receiptNumber || null,
      },
    });
  }

  await recordFailedTransaction({
    paymentId,
    gatewayTransactionId,
    gatewayProvider,
    rawPayload: req.body,
    signatureVerified: true,
  });

  return sendSuccess(res, {
    message: 'Failed payment recorded. Voucher remains unpaid.',
    data: { status: 'failed' },
  });
});

/**
 * POST /api/v1/payments/manual
 * Admin verifies and records an in-person cash or bank transfer payment.
 */
export const recordManualPayment = catchAsync(async (req, res, next) => {
  const { voucherId, amountPaid, paymentMethod, transactionReference } = req.body;

  const voucher = await FeeVoucher.findById(voucherId);
  if (!voucher) return next(new AppError('Fee voucher not found.', 404, 'VOUCHER_NOT_FOUND'));

  if (voucher.status === 'paid') {
    return next(new AppError('Voucher is already paid.', 409, 'VOUCHER_ALREADY_PAID'));
  }

  const payment = await Payment.create({
    voucherId: voucher._id,
    studentId: voucher.studentId,
    amountPaid,
    paymentMethod,
    status: 'pending',
    collectedByUserId: req.user._id,
  });

  const result = await reconcileSettledTransaction({
    paymentId: payment._id,
    gatewayTransactionId: transactionReference,
    gatewayProvider: 'manual_counter',
    amountSettled: amountPaid,
    rawPayload: { recordedBy: req.user._id, method: paymentMethod },
    signatureVerified: true,
  });

  await recordAuditLog({
    req,
    action: 'MANUAL_PAYMENT_RECORDED',
    targetEntity: 'Payment',
    targetEntityId: payment._id,
    metadata: { voucherNumber: voucher.voucherNumber, amountPaid, transactionReference },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Manual payment verified and receipt issued.',
    data: {
      payment: result.payment,
      receipt: result.receipt,
    },
  });
});

/**
 * GET /api/v1/payments
 * Admin sees all payments; Student sees own payments.
 */
export const listPayments = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) return sendSuccess(res, { message: 'Payments retrieved.', data: { payments: [] } });
    filter.studentId = student._id;
  }

  const payments = await Payment.find(filter)
    .populate('studentId', 'studentId fullName')
    .populate('voucherId', 'voucherNumber billingMonth totalPayable')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return sendSuccess(res, {
    message: 'Payments retrieved.',
    data: { payments },
  });
});

/**
 * POST /api/v1/payments/:id/refund
 * Admin refunds a completed payment and reverts student fee ledger.
 */
export const refundPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return next(new AppError('Payment not found.', 404, 'PAYMENT_NOT_FOUND'));

  if (payment.status !== 'completed') {
    return next(new AppError('Only completed payments can be refunded.', 400, 'INVALID_REFUND_STATE'));
  }

  const refund = await Refund.create({
    paymentId: payment._id,
    studentId: payment.studentId,
    amount: payment.amountPaid,
    reason: req.body.reason,
    processedByUserId: req.user._id,
  });

  payment.status = 'refunded';
  await payment.save();

  await FeeVoucher.findByIdAndUpdate(payment.voucherId, {
    $set: { status: 'refunded' },
  });

  await StudentFee.findOneAndUpdate(
    { studentId: payment.studentId },
    { $inc: { totalPaid: -payment.amountPaid, currentBalance: payment.amountPaid } }
  );

  await recordAuditLog({
    req,
    action: 'PAYMENT_REFUNDED',
    targetEntity: 'Refund',
    targetEntityId: refund._id,
    metadata: { paymentId: payment._id, amount: refund.amount, reason: refund.reason },
  });

  return sendSuccess(res, {
    message: 'Payment refunded and ledger adjusted.',
    data: { refund },
  });
});

/**
 * GET /api/v1/receipts
 * Admin sees all receipts; Student sees own receipts.
 */
export const listReceipts = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) return sendSuccess(res, { message: 'Receipts retrieved.', data: { receipts: [] } });
    filter.studentId = student._id;
  }

  const receipts = await PaymentReceipt.find(filter)
    .populate('studentId', 'studentId fullName')
    .populate('voucherId', 'voucherNumber billingMonth')
    .sort({ issuedAt: -1 })
    .limit(100)
    .lean();

  return sendSuccess(res, {
    message: 'Payment receipts retrieved.',
    data: { receipts },
  });
});

/**
 * GET /api/v1/receipts/:id/pdf
 * Streams printable A4 Payment Receipt PDF for Admin or owning Student.
 */
export const downloadReceiptPdf = catchAsync(async (req, res, next) => {
  const receipt = await PaymentReceipt.findById(req.params.id)
    .populate('studentId')
    .populate('voucherId', 'voucherNumber billingMonth')
    .lean();

  if (!receipt) {
    return next(new AppError('Payment receipt not found.', 404, 'RECEIPT_NOT_FOUND'));
  }

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student || receipt.studentId._id.toString() !== student._id.toString()) {
      return next(
        new AppError('Access denied. You can only download your own receipts.', 403, 'FORBIDDEN_OWNER')
      );
    }
  }

  return streamPaymentReceiptPdf(res, {
    receipt,
    voucher: receipt.voucherId,
    student: receipt.studentId,
  });
});
