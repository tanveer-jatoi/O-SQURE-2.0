import crypto from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env.js';
import { Payment } from '../models/Payment.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentReceipt } from '../models/PaymentReceipt.js';
import { FeeVoucher } from '../models/FeeVoucher.js';
import { StudentFee } from '../models/StudentFee.js';
import { generateCode } from '../utils/idGenerator.js';

/**
 * Generates a base64 PNG QR image from a structured payment QR payload.
 */
export async function renderPaymentQrDataUrl(qrPayloadString) {
  return QRCode.toDataURL(qrPayloadString, {
    width: 260,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

/**
 * Verifies an external payment provider webhook HMAC-SHA256 signature.
 */
export function verifyPaymentWebhookSignature(payloadObj, signatureHeader) {
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', env.paymentWebhookSecret)
    .update(JSON.stringify(payloadObj))
    .digest('hex');

  const actualBuf = Buffer.from(signatureHeader, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Idempotently reconciles a verified settled transaction:
 *  - Prevents duplicate callbacks from double-crediting the voucher/ledger
 *  - Updates Payment, PaymentTransaction, FeeVoucher, StudentFee
 *  - Issues an official PaymentReceipt
 */
export async function reconcileSettledTransaction({
  paymentId,
  gatewayTransactionId,
  gatewayProvider,
  amountSettled,
  rawPayload = {},
  signatureVerified = true,
}) {
  const existingSettled = await PaymentTransaction.findOne({
    gatewayTransactionId,
    transactionStatus: 'settled',
  });

  if (existingSettled) {
    return { alreadyProcessed: true, transaction: existingSettled };
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment record not found during reconciliation.');
  }

  const voucher = await FeeVoucher.findById(payment.voucherId);
  if (!voucher) {
    throw new Error('Fee voucher not found during reconciliation.');
  }

  const txn = await PaymentTransaction.findOneAndUpdate(
    { paymentId: payment._id },
    {
      $set: {
        voucherId: voucher._id,
        gatewayTransactionId,
        gatewayProvider,
        rawWebhookPayload: rawPayload,
        signatureVerified,
        transactionStatus: 'settled',
      },
    },
    { new: true, upsert: true }
  );

  payment.status = 'completed';
  payment.amountPaid = amountSettled;
  payment.paymentDate = new Date();
  await payment.save();

  voucher.paidAmount += amountSettled;
  voucher.status = voucher.paidAmount >= voucher.totalPayable ? 'paid' : 'partially_paid';
  await voucher.save();

  await StudentFee.findOneAndUpdate(
    { studentId: voucher.studentId },
    { $inc: { totalPaid: amountSettled, currentBalance: -amountSettled } }
  );

  const receipt = await PaymentReceipt.create({
    receiptNumber: generateCode('REC'),
    paymentId: payment._id,
    voucherId: voucher._id,
    studentId: voucher.studentId,
    amountPaid: amountSettled,
    paymentMethod: payment.paymentMethod,
    transactionReference: gatewayTransactionId,
  });

  return { alreadyProcessed: false, payment, transaction: txn, voucher, receipt };
}

/**
 * Records a failed payment transaction without ever marking the voucher as paid.
 */
export async function recordFailedTransaction({
  paymentId,
  gatewayTransactionId,
  gatewayProvider,
  rawPayload = {},
  signatureVerified = true,
}) {
  const payment = await Payment.findById(paymentId);
  if (!payment) return null;

  payment.status = 'failed';
  await payment.save();

  await PaymentTransaction.findOneAndUpdate(
    { paymentId: payment._id },
    {
      $set: {
        voucherId: payment.voucherId,
        gatewayTransactionId,
        gatewayProvider,
        rawWebhookPayload: rawPayload,
        signatureVerified,
        transactionStatus: 'failed',
      },
    },
    { upsert: true }
  );

  return payment;
}
