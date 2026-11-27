import { FeeVoucher } from '../models/FeeVoucher.js';
import { StudentFee } from '../models/StudentFee.js';
import { Student } from '../models/Student.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateCode } from '../utils/idGenerator.js';
import {
  computeVoucherAmounts,
  buildPaymentReference,
  buildQrPayloadString,
} from '../services/feeService.js';
import { streamFeeVoucherPdf } from '../services/pdfFinanceService.js';
import { recordAuditLog } from '../services/auditService.js';

export const listVouchers = catchAsync(async (req, res) => {
  const { status, billingMonth, page = 1, limit = 25 } = req.query;
  const filter = {};

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) {
      return sendSuccess(res, { message: 'Vouchers retrieved.', data: { vouchers: [] } });
    }
    filter.studentId = student._id;
  }

  if (status) filter.status = status;
  if (billingMonth) filter.billingMonth = billingMonth;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const skip = (pageNum - 1) * limitNum;

  const [vouchers, total] = await Promise.all([
    FeeVoucher.find(filter)
      .populate('studentId', 'studentId fullName contactPhone')
      .populate('batchId', 'batchCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    FeeVoucher.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Fee vouchers retrieved.',
    data: { vouchers },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const generateVoucher = catchAsync(async (req, res, next) => {
  const {
    studentId,
    billingMonth,
    description,
    dueDate,
    includeAdmission,
    includeExam,
    lateCharges,
  } = req.body;

  const [student, feeAccount] = await Promise.all([
    Student.findById(studentId),
    StudentFee.findOne({ studentId }).populate('feeStructureId'),
  ]);

  if (!student) return next(new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND'));
  if (!feeAccount || !feeAccount.feeStructureId) {
    return next(
      new AppError(
        'Student does not have an assigned Fee Structure yet.',
        400,
        'FEE_STRUCTURE_NOT_ASSIGNED'
      )
    );
  }

  const amounts = computeVoucherAmounts({
    feeStructure: feeAccount.feeStructureId,
    discountPercentage: feeAccount.discountPercentage,
    scholarshipAmount: feeAccount.scholarshipAmount,
    includeAdmission,
    includeExam,
    lateCharges,
  });

  const voucherNumber = generateCode('VCH');
  const paymentReference = buildPaymentReference();
  const qrPayloadString = buildQrPayloadString({
    voucherNumber,
    paymentReference,
    totalPayable: amounts.totalPayable,
  });

  const voucher = await FeeVoucher.create({
    voucherNumber,
    studentId: student._id,
    batchId: student.currentBatchId || null,
    billingMonth,
    description,
    dueDate: new Date(dueDate),
    ...amounts,
    paymentReference,
    qrPayloadString,
    status: 'pending',
  });

  feeAccount.totalBilled += amounts.totalPayable;
  feeAccount.currentBalance += amounts.totalPayable;
  await feeAccount.save();

  await recordAuditLog({
    req,
    action: 'FEE_VOUCHER_GENERATED',
    targetEntity: 'FeeVoucher',
    targetEntityId: voucher._id,
    metadata: {
      voucherNumber: voucher.voucherNumber,
      studentId: student.studentId,
      totalPayable: voucher.totalPayable,
    },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Fee voucher generated successfully.',
    data: { voucher },
  });
});

export const applyLateFine = catchAsync(async (req, res, next) => {
  const voucher = await FeeVoucher.findById(req.params.id);
  if (!voucher) return next(new AppError('Fee voucher not found.', 404, 'VOUCHER_NOT_FOUND'));

  if (voucher.status === 'paid') {
    return next(new AppError('Cannot apply late fine to a paid voucher.', 400, 'VOUCHER_ALREADY_PAID'));
  }

  const addedFine = Number(req.body.lateCharges);
  voucher.lateCharges += addedFine;
  voucher.totalPayable += addedFine;
  voucher.status = 'overdue';
  voucher.qrPayloadString = buildQrPayloadString({
    voucherNumber: voucher.voucherNumber,
    paymentReference: voucher.paymentReference,
    totalPayable: voucher.totalPayable,
  });
  await voucher.save();

  await StudentFee.findOneAndUpdate(
    { studentId: voucher.studentId },
    { $inc: { totalBilled: addedFine, currentBalance: addedFine } }
  );

  await recordAuditLog({
    req,
    action: 'FEE_LATE_FINE_APPLIED',
    targetEntity: 'FeeVoucher',
    targetEntityId: voucher._id,
    metadata: { voucherNumber: voucher.voucherNumber, addedFine },
  });

  return sendSuccess(res, {
    message: 'Late charge applied to voucher.',
    data: { voucher },
  });
});

/**
 * GET /api/v1/vouchers/:id/pdf
 * Streams A4 PDF Fee Voucher for Admin or the owning Student.
 */
export const downloadVoucherPdf = catchAsync(async (req, res, next) => {
  const voucher = await FeeVoucher.findById(req.params.id)
    .populate('studentId')
    .populate('batchId', 'batchCode')
    .lean();

  if (!voucher) {
    return next(new AppError('Fee voucher not found.', 404, 'VOUCHER_NOT_FOUND'));
  }

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student || voucher.studentId._id.toString() !== student._id.toString()) {
      return next(
        new AppError('Access denied. You can only download your own vouchers.', 403, 'FORBIDDEN_OWNER')
      );
    }
  }

  return streamFeeVoucherPdf(res, {
    voucher,
    student: voucher.studentId,
  });
});
