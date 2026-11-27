import { AttendanceSession } from '../models/AttendanceSession.js';
import { Attendance } from '../models/Attendance.js';
import { Student } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  parseQrTokenUnverified,
  verifyQrTokenSignature,
} from '../services/qrAttendanceService.js';
import { getTeacherAssignedBatchIds } from '../services/scheduleConflictService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * POST /api/v1/attendance/scan
 * Student submits an ephemeral QR token scanned from the classroom screen.
 */
export const scanQrAttendance = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  const parsed = parseQrTokenUnverified(token);
  if (!parsed) {
    return next(new AppError('Malformed QR code payload.', 400, 'INVALID_QR_PAYLOAD'));
  }

  const session = await AttendanceSession.findById(parsed.payload.sid)
    .select('+sessionSecret')
    .populate('batchId', 'batchCode');

  if (!session) {
    return next(new AppError('Attendance session does not exist.', 404, 'SESSION_NOT_FOUND'));
  }

  if (!session.isActive || session.expiresAt < new Date()) {
    return next(
      new AppError('This attendance session has closed or expired.', 400, 'SESSION_EXPIRED')
    );
  }

  const verification = verifyQrTokenSignature(parsed, session.sessionSecret);
  if (!verification.valid) {
    const msg =
      verification.reason === 'QR_TOKEN_EXPIRED'
        ? 'QR code expired. Please scan the live rotating QR on the screen.'
        : 'Invalid QR signature.';
    return next(new AppError(msg, 400, verification.reason));
  }

  const student = await Student.findOne({ userId: req.user._id }).lean();
  if (!student) {
    return next(new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND'));
  }

  const isEnrolled = await Enrollment.exists({
    studentId: student._id,
    batchId: session.batchId._id,
    status: 'active',
  });
  if (!isEnrolled) {
    return next(
      new AppError('You are not enrolled in this batch.', 403, 'NOT_ENROLLED_IN_BATCH')
    );
  }

  const existing = await Attendance.findOne({
    sessionId: session._id,
    studentId: student._id,
  });
  if (existing && existing.status !== 'pending') {
    return next(
      new AppError(
        `Attendance already recorded for this session (${existing.status}).`,
        409,
        'DUPLICATE_SCAN'
      )
    );
  }

  const now = new Date();
  const lateCutoff = new Date(
    session.startTime.getTime() + session.lateThresholdMinutes * 60 * 1000
  );
  const computedStatus = now > lateCutoff ? 'late' : 'present';

  const deviceInfo = `${req.ip || 'unknown'} | ${req.headers['user-agent'] || 'unknown'}`;

  const record = existing
    ? await Attendance.findByIdAndUpdate(
        existing._id,
        { status: computedStatus, scannedAt: now, deviceInfo },
        { new: true }
      )
    : await Attendance.create({
        sessionId: session._id,
        batchId: session.batchId._id,
        studentId: student._id,
        attendanceDate: session.sessionDate,
        status: computedStatus,
        scannedAt: now,
        deviceInfo,
      });

  return sendSuccess(res, {
    statusCode: 201,
    message: `Attendance marked as ${computedStatus.toUpperCase()} for batch ${session.batchId.batchCode}.`,
    data: { attendance: record },
  });
});

/**
 * GET /api/v1/attendance/my-history
 * Student views their own attendance records & summary stats.
 */
export const getMyAttendanceHistory = catchAsync(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user._id }).lean();
  if (!student) {
    return next(new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND'));
  }

  const records = await Attendance.find({ studentId: student._id })
    .populate('batchId', 'batchCode')
    .populate('sessionId', 'sessionCode sessionDate')
    .sort({ attendanceDate: -1 })
    .limit(100)
    .lean();

  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const percentage =
    total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return sendSuccess(res, {
    message: 'Attendance history retrieved.',
    data: {
      summary: { total, presentCount, lateCount, absentCount, percentage },
      records,
    },
  });
});

/**
 * GET /api/v1/attendance
 * Admin sees all records; Teacher sees records for assigned batches only.
 */
export const listAttendanceRecords = catchAsync(async (req, res) => {
  const { batchId, status, page = 1, limit = 25 } = req.query;
  const filter = {};

  if (req.user.role === 'teacher') {
    const assignedIds = await getTeacherAssignedBatchIds(req.user._id);
    if (batchId) {
      filter.batchId = assignedIds.includes(batchId) ? batchId : null;
    } else {
      filter.batchId = { $in: assignedIds };
    }
  } else if (batchId) {
    filter.batchId = batchId;
  }

  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const skip = (pageNum - 1) * limitNum;

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('studentId', 'studentId fullName')
      .populate('batchId', 'batchCode')
      .populate('sessionId', 'sessionCode')
      .sort({ attendanceDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Attendance records retrieved.',
    data: { records },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * PATCH /api/v1/attendance/:id
 * Admin manual attendance correction with mandatory reason and AuditLog entry.
 */
export const correctAttendanceRecord = catchAsync(async (req, res, next) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) {
    return next(new AppError('Attendance record not found.', 404, 'ATTENDANCE_NOT_FOUND'));
  }

  const previousStatus = record.status;
  record.status = req.body.status;
  record.isManualCorrection = true;
  record.correctedByUserId = req.user._id;
  record.correctionReason = req.body.reason;
  await record.save();

  await recordAuditLog({
    req,
    action: 'ATTENDANCE_MANUAL_CORRECTION',
    targetEntity: 'Attendance',
    targetEntityId: record._id,
    metadata: {
      previousStatus,
      newStatus: req.body.status,
      reason: req.body.reason,
    },
  });

  return sendSuccess(res, {
    message: 'Attendance record corrected and logged.',
    data: { attendance: record },
  });
});
