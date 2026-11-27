import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { provisionStudentAccount } from '../services/onboardingService.js';
import { getTeacherAssignedBatchIds } from '../services/scheduleConflictService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * GET /api/v1/students
 * Admin & Super Admin see all students.
 * Teachers only see students assigned to their batches (empty until Phase 13 batch assignments).
 */
export const listStudents = catchAsync(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  if (req.user.role === 'teacher') {
    const batchIds = await getTeacherAssignedBatchIds(req.user._id);
    if (batchIds.length === 0) {
      return sendSuccess(res, {
        message: 'Assigned students retrieved.',
        data: { students: [] },
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }
    const enrollments = await Enrollment.find({
      batchId: { $in: batchIds },
      status: 'active',
    })
      .select('studentId')
      .lean();
    const assignedStudentIds = enrollments.map((e) => e.studentId);
    const assignedStudents = await Student.find({ _id: { $in: assignedStudentIds } })
      .populate('currentBatchId', 'batchCode')
      .sort({ fullName: 1 })
      .lean();
    return sendSuccess(res, {
      message: 'Assigned students retrieved.',
      data: { students: assignedStudents },
      meta: {
        page: 1,
        limit: assignedStudents.length || 20,
        total: assignedStudents.length,
        totalPages: 1,
      },
    });
  }

  const filter = {};
  if (status) filter.academicStatus = status;
  if (search) {
    const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { fullName: regex },
      { studentId: regex },
      { cnicBForm: regex },
      { contactPhone: regex },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('userId', 'username email status lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Students retrieved successfully.',
    data: { students },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * POST /api/v1/students
 * Creates a Student dossier along with its linked User login account.
 */
export const createStudent = catchAsync(async (req, res) => {
  const { student } = await provisionStudentAccount(req.body, req.user._id);

  await recordAuditLog({
    req,
    action: 'STUDENT_CREATED',
    targetEntity: 'Student',
    targetEntityId: student._id,
    metadata: { studentId: student.studentId, fullName: student.fullName },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Student enrolled and portal account created.',
    data: { student },
  });
});

/**
 * GET /api/v1/students/me
 * Allows a logged-in student to retrieve their own profile.
 */
export const getMyStudentProfile = catchAsync(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user._id }).populate(
    'userId',
    'username email status lastLogin'
  );
  if (!student) {
    return next(new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND'));
  }

  return sendSuccess(res, {
    message: 'Student profile retrieved.',
    data: { student },
  });
});

/**
 * GET /api/v1/students/:id
 * Accessible by Admin/Super Admin, or the owning Student.
 */
export const getStudentById = catchAsync(async (req, res, next) => {
  const student = await Student.findById(req.params.id).populate(
    'userId',
    'username email status lastLogin'
  );

  if (!student) {
    return next(new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND'));
  }

  if (req.user.role === 'student' && !student.userId._id.equals(req.user._id)) {
    return next(new AppError('Access denied. You can only view your own profile.', 403, 'FORBIDDEN_OWNER'));
  }

  if (req.user.role === 'teacher') {
    const batchIds = await getTeacherAssignedBatchIds(req.user._id);
    const isAssigned = await Enrollment.exists({
      studentId: student._id,
      batchId: { $in: batchIds },
      status: 'active',
    });
    if (!isAssigned) {
      return next(
        new AppError(
          'Access denied. Student is not in your assigned batches.',
          403,
          'FORBIDDEN_ASSIGNMENT'
        )
      );
    }
  }

  return sendSuccess(res, {
    message: 'Student retrieved.',
    data: { student },
  });
});

/**
 * PATCH /api/v1/students/:id
 * Updates student details and synchronizes linked User status if suspended/dropped.
 */
export const updateStudent = catchAsync(async (req, res, next) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!student) {
    return next(new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND'));
  }

  if (req.body.academicStatus) {
    const userStatus = req.body.academicStatus === 'active' ? 'active' : 'suspended';
    await User.findByIdAndUpdate(student.userId, { status: userStatus });
  }

  await recordAuditLog({
    req,
    action: 'STUDENT_UPDATED',
    targetEntity: 'Student',
    targetEntityId: student._id,
    metadata: { updatedFields: Object.keys(req.body) },
  });

  return sendSuccess(res, {
    message: 'Student record updated.',
    data: { student },
  });
});
