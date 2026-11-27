import { Teacher } from '../models/Teacher.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { provisionTeacherAccount } from '../services/onboardingService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * GET /api/v1/teachers
 * Lists all faculty members for Super Admin and Admin.
 */
export const listTeachers = catchAsync(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { fullName: regex },
      { teacherId: regex },
      { email: regex },
      { qualification: regex },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [teachers, total] = await Promise.all([
    Teacher.find(filter)
      .populate('userId', 'username email status lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Teacher.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Teachers retrieved successfully.',
    data: { teachers },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * POST /api/v1/teachers
 * Creates a Teacher profile + linked User login account.
 */
export const createTeacher = catchAsync(async (req, res) => {
  const { teacher } = await provisionTeacherAccount(req.body, req.user._id);

  await recordAuditLog({
    req,
    action: 'TEACHER_CREATED',
    targetEntity: 'Teacher',
    targetEntityId: teacher._id,
    metadata: { teacherId: teacher.teacherId, fullName: teacher.fullName },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Teacher profile and portal account created.',
    data: { teacher },
  });
});

/**
 * GET /api/v1/teachers/me
 * Allows a logged-in teacher to view their own private dossier.
 */
export const getMyTeacherProfile = catchAsync(async (req, res, next) => {
  const teacher = await Teacher.findOne({ userId: req.user._id }).populate(
    'userId',
    'username email status lastLogin'
  );
  if (!teacher) {
    return next(new AppError('Teacher profile not found.', 404, 'TEACHER_NOT_FOUND'));
  }

  return sendSuccess(res, {
    message: 'Teacher profile retrieved.',
    data: { teacher },
  });
});

/**
 * GET /api/v1/teachers/:id
 * Accessible by Admin/Super Admin, or the owning Teacher.
 */
export const getTeacherById = catchAsync(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id).populate(
    'userId',
    'username email status lastLogin'
  );
  if (!teacher) {
    return next(new AppError('Teacher not found.', 404, 'TEACHER_NOT_FOUND'));
  }

  if (req.user.role === 'teacher' && !teacher.userId._id.equals(req.user._id)) {
    return next(
      new AppError(
        'Access denied. You cannot view another teacher\'s private records.',
        403,
        'FORBIDDEN_OWNER'
      )
    );
  }

  return sendSuccess(res, {
    message: 'Teacher retrieved.',
    data: { teacher },
  });
});

/**
 * PATCH /api/v1/teachers/:id
 */
export const updateTeacher = catchAsync(async (req, res, next) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!teacher) {
    return next(new AppError('Teacher not found.', 404, 'TEACHER_NOT_FOUND'));
  }

  if (req.body.status) {
    const userStatus = req.body.status === 'active' ? 'active' : 'suspended';
    await User.findByIdAndUpdate(teacher.userId, { status: userStatus });
  }

  await recordAuditLog({
    req,
    action: 'TEACHER_UPDATED',
    targetEntity: 'Teacher',
    targetEntityId: teacher._id,
    metadata: { updatedFields: Object.keys(req.body) },
  });

  return sendSuccess(res, {
    message: 'Teacher record updated.',
    data: { teacher },
  });
});
