import { Admission } from '../models/Admission.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateCode } from '../utils/idGenerator.js';
import { provisionStudentAccount } from '../services/onboardingService.js';
import { recordAuditLog } from '../services/auditService.js';

export const listAdmissions = catchAsync(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { candidateName: regex },
      { inquiryNumber: regex },
      { email: regex },
      { contactPhone: regex },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [admissions, total] = await Promise.all([
    Admission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Admission.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Admissions retrieved.',
    data: { admissions },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const createAdmission = catchAsync(async (req, res) => {
  const admission = await Admission.create({
    ...req.body,
    inquiryNumber: generateCode('ADM'),
    dob: new Date(req.body.dob),
    processedByUserId: req.user._id,
  });

  await recordAuditLog({
    req,
    action: 'ADMISSION_CREATED',
    targetEntity: 'Admission',
    targetEntityId: admission._id,
    metadata: { inquiryNumber: admission.inquiryNumber, candidateName: admission.candidateName },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Admission inquiry logged.',
    data: { admission },
  });
});

export const updateAdmissionStatus = catchAsync(async (req, res, next) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return next(new AppError('Admission inquiry not found.', 404, 'ADMISSION_NOT_FOUND'));
  }

  if (admission.status === 'enrolled') {
    return next(new AppError('Enrolled applications cannot be reverted.', 400, 'ALREADY_ENROLLED'));
  }

  admission.status = req.body.status;
  if (req.body.notes !== undefined) admission.notes = req.body.notes;
  admission.processedByUserId = req.user._id;
  await admission.save();

  await recordAuditLog({
    req,
    action: 'ADMISSION_STATUS_UPDATED',
    targetEntity: 'Admission',
    targetEntityId: admission._id,
    metadata: { status: admission.status },
  });

  return sendSuccess(res, {
    message: `Admission status updated to ${admission.status}.`,
    data: { admission },
  });
});

/**
 * POST /api/v1/admissions/:id/convert
 * Converts an approved admission inquiry into an active User + Student profile.
 */
export const convertAdmissionToStudent = catchAsync(async (req, res, next) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return next(new AppError('Admission inquiry not found.', 404, 'ADMISSION_NOT_FOUND'));
  }

  if (admission.status === 'enrolled') {
    return next(new AppError('This applicant has already been enrolled.', 409, 'ALREADY_ENROLLED'));
  }

  if (admission.status !== 'approved') {
    return next(
      new AppError(
        'Only approved inquiries can be converted into enrolled students.',
        400,
        'ADMISSION_NOT_APPROVED'
      )
    );
  }

  const { student } = await provisionStudentAccount(
    {
      username: req.body.username,
      password: req.body.password,
      email: admission.email,
      fullName: admission.candidateName,
      fatherName: admission.fatherName,
      cnicBForm: admission.cnicBForm,
      gender: admission.gender,
      dob: admission.dob,
      contactPhone: admission.contactPhone,
      guardianPhone: admission.guardianPhone,
      address: admission.address,
    },
    req.user._id
  );

  admission.status = 'enrolled';
  admission.convertedStudentId = student._id;
  admission.processedByUserId = req.user._id;
  await admission.save();

  await recordAuditLog({
    req,
    action: 'ADMISSION_CONVERTED_TO_STUDENT',
    targetEntity: 'Admission',
    targetEntityId: admission._id,
    metadata: { studentId: student.studentId, inquiryNumber: admission.inquiryNumber },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Applicant converted to enrolled student successfully.',
    data: { admission, student },
  });
});
