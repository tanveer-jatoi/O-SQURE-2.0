import { FeeStructure } from '../models/FeeStructure.js';
import { StudentFee } from '../models/StudentFee.js';
import { FeeVoucher } from '../models/FeeVoucher.js';
import { Student } from '../models/Student.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../services/auditService.js';

export const listFeeStructures = catchAsync(async (req, res) => {
  const structures = await FeeStructure.find()
    .populate('courseId', 'courseCode title')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: 'Fee structures retrieved.',
    data: { feeStructures: structures },
  });
});

export const createFeeStructure = catchAsync(async (req, res) => {
  const structure = await FeeStructure.create(req.body);

  await recordAuditLog({
    req,
    action: 'FEE_STRUCTURE_CREATED',
    targetEntity: 'FeeStructure',
    targetEntityId: structure._id,
    metadata: { title: structure.title, tuitionFee: structure.tuitionFee },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Fee structure created.',
    data: { feeStructure: structure },
  });
});

export const listStudentFeeAccounts = catchAsync(async (req, res) => {
  const accounts = await StudentFee.find()
    .populate('studentId', 'studentId fullName contactPhone')
    .populate('feeStructureId', 'title tuitionFee labFee')
    .sort({ updatedAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: 'Student fee accounts retrieved.',
    data: { accounts },
  });
});

export const assignStudentFeeAccount = catchAsync(async (req, res, next) => {
  const { studentId, feeStructureId, discountPercentage, scholarshipAmount } = req.body;

  const [student, structure] = await Promise.all([
    Student.findById(studentId),
    FeeStructure.findById(feeStructureId),
  ]);

  if (!student) return next(new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND'));
  if (!structure) return next(new AppError('Fee structure not found.', 404, 'FEE_STRUCTURE_NOT_FOUND'));

  const account = await StudentFee.findOneAndUpdate(
    { studentId },
    {
      $set: {
        feeStructureId,
        discountPercentage,
        scholarshipAmount,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  await recordAuditLog({
    req,
    action: 'STUDENT_FEE_ASSIGNED',
    targetEntity: 'StudentFee',
    targetEntityId: account._id,
    metadata: { studentId: student.studentId, discountPercentage, scholarshipAmount },
  });

  return sendSuccess(res, {
    message: 'Fee structure and concessions assigned to student.',
    data: { account },
  });
});

/**
 * GET /api/v1/fees/my-summary
 * Student views their own total payable, pending, paid, overdue totals, and vouchers.
 */
export const getMyFeeSummary = catchAsync(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user._id }).lean();
  if (!student) return next(new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND'));

  const [account, vouchers] = await Promise.all([
    StudentFee.findOne({ studentId: student._id })
      .populate('feeStructureId', 'title tuitionFee labFee')
      .lean(),
    FeeVoucher.find({ studentId: student._id })
      .populate('batchId', 'batchCode')
      .sort({ dueDate: -1 })
      .lean(),
  ]);

  let pendingAmount = 0;
  let paidAmount = 0;
  let overdueAmount = 0;

  vouchers.forEach((v) => {
    const remaining = Math.max(0, v.totalPayable - v.paidAmount);
    if (v.status === 'paid') {
      paidAmount += v.paidAmount;
    } else if (v.status === 'overdue') {
      overdueAmount += remaining;
      pendingAmount += remaining;
    } else if (['pending', 'processing', 'partially_paid'].includes(v.status)) {
      pendingAmount += remaining;
      paidAmount += v.paidAmount;
    }
  });

  return sendSuccess(res, {
    message: 'Student fee summary retrieved.',
    data: {
      account,
      totals: {
        totalPayable: pendingAmount + paidAmount,
        pendingAmount,
        paidAmount,
        overdueAmount,
      },
      vouchers,
    },
  });
});
