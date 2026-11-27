import { AttendanceSession } from '../models/AttendanceSession.js';
import { Attendance } from '../models/Attendance.js';
import { Batch } from '../models/Batch.js';
import { Teacher } from '../models/Teacher.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateCode } from '../utils/idGenerator.js';
import {
  generateSessionSecret,
  createEphemeralQrPayload,
} from '../services/qrAttendanceService.js';
import { getTeacherAssignedBatchIds } from '../services/scheduleConflictService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * POST /api/v1/attendance-sessions
 * Starts a dynamic QR attendance session for an assigned batch.
 */
export const startAttendanceSession = catchAsync(async (req, res, next) => {
  const { batchId, durationMinutes, lateThresholdMinutes } = req.body;

  const batch = await Batch.findById(batchId);
  if (!batch) {
    return next(new AppError('Batch not found.', 404, 'BATCH_NOT_FOUND'));
  }

  let teacherId = batch.assignedTeacherId;
  if (req.user.role === 'teacher') {
    const assignedBatchIds = await getTeacherAssignedBatchIds(req.user._id);
    if (!assignedBatchIds.includes(batchId)) {
      return next(
        new AppError('Access denied. You are not assigned to this batch.', 403, 'FORBIDDEN_ASSIGNMENT')
      );
    }
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (teacher) teacherId = teacher._id;
  }

  const startTime = new Date();
  const expiresAt = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const sessionSecret = generateSessionSecret();

  const session = await AttendanceSession.create({
    sessionCode: generateCode('ATT'),
    batchId,
    teacherId,
    sessionDate: startTime,
    startTime,
    expiresAt,
    sessionSecret,
    lateThresholdMinutes,
    isActive: true,
  });

  const qr = await createEphemeralQrPayload(session._id, sessionSecret);

  await recordAuditLog({
    req,
    action: 'ATTENDANCE_SESSION_STARTED',
    targetEntity: 'AttendanceSession',
    targetEntityId: session._id,
    metadata: { sessionCode: session.sessionCode, batchId },
  });

  const safeSession = session.toObject();
  delete safeSession.sessionSecret;

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Attendance QR session started.',
    data: { session: safeSession, qr },
  });
});

/**
 * GET /api/v1/attendance-sessions
 * Lists attendance sessions scoped by role.
 */
export const listAttendanceSessions = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'teacher') {
    const batchIds = await getTeacherAssignedBatchIds(req.user._id);
    filter.batchId = { $in: batchIds };
  }

  const sessions = await AttendanceSession.find(filter)
    .populate('batchId', 'batchCode daysPattern startTime endTime')
    .populate('teacherId', 'fullName teacherId')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return sendSuccess(res, {
    message: 'Attendance sessions retrieved.',
    data: { sessions },
  });
});

/**
 * GET /api/v1/attendance-sessions/:id/qr
 * Rotates and returns a fresh 30-second QR code for an active session.
 */
export const refreshSessionQr = catchAsync(async (req, res, next) => {
  const session = await AttendanceSession.findById(req.params.id).select('+sessionSecret');
  if (!session) {
    return next(new AppError('Attendance session not found.', 404, 'SESSION_NOT_FOUND'));
  }

  if (req.user.role === 'teacher') {
    const assignedBatchIds = await getTeacherAssignedBatchIds(req.user._id);
    if (!assignedBatchIds.includes(session.batchId.toString())) {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN_ASSIGNMENT'));
    }
  }

  if (!session.isActive || session.expiresAt < new Date()) {
    if (session.isActive) {
      session.isActive = false;
      session.closedAt = new Date();
      await session.save();
    }
    return next(new AppError('Attendance session has ended or expired.', 400, 'SESSION_ENDED'));
  }

  const qr = await createEphemeralQrPayload(session._id, session.sessionSecret);
  const scannedCount = await Attendance.countDocuments({
    sessionId: session._id,
    status: { $in: ['present', 'late'] },
  });

  return sendSuccess(res, {
    message: 'Fresh QR token generated.',
    data: { qr, scannedCount, expiresAt: session.expiresAt },
  });
});

/**
 * GET /api/v1/attendance-sessions/:id/live
 * Returns the live attendance roster (scanned + pending enrolled students).
 */
export const getSessionLiveStatus = catchAsync(async (req, res, next) => {
  const session = await AttendanceSession.findById(req.params.id)
    .populate('batchId', 'batchCode')
    .lean();
  if (!session) {
    return next(new AppError('Attendance session not found.', 404, 'SESSION_NOT_FOUND'));
  }

  if (req.user.role === 'teacher') {
    const assignedBatchIds = await getTeacherAssignedBatchIds(req.user._id);
    if (!assignedBatchIds.includes(session.batchId._id.toString())) {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN_ASSIGNMENT'));
    }
  }

  const [enrollments, records] = await Promise.all([
    Enrollment.find({ batchId: session.batchId._id, status: 'active' })
      .populate('studentId', 'studentId fullName')
      .lean(),
    Attendance.find({ sessionId: session._id }).lean(),
  ]);

  const recordByStudent = new Map(records.map((r) => [r.studentId.toString(), r]));
  const roster = enrollments.map((e) => {
    const rec = recordByStudent.get(e.studentId._id.toString());
    return {
      studentId: e.studentId.studentId,
      fullName: e.studentId.fullName,
      status: rec ? rec.status : session.isActive ? 'pending' : 'absent',
      scannedAt: rec?.scannedAt || null,
    };
  });

  return sendSuccess(res, {
    message: 'Live session roster retrieved.',
    data: { session, roster },
  });
});

/**
 * PATCH /api/v1/attendance-sessions/:id/close
 * Stops an active attendance session and marks unscanned enrolled students as absent.
 */
export const closeAttendanceSession = catchAsync(async (req, res, next) => {
  const session = await AttendanceSession.findById(req.params.id);
  if (!session) {
    return next(new AppError('Attendance session not found.', 404, 'SESSION_NOT_FOUND'));
  }

  if (req.user.role === 'teacher') {
    const assignedBatchIds = await getTeacherAssignedBatchIds(req.user._id);
    if (!assignedBatchIds.includes(session.batchId.toString())) {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN_ASSIGNMENT'));
    }
  }

  session.isActive = false;
  session.closedAt = new Date();
  await session.save();

  // Mark enrolled students who did not scan as 'absent'
  const [enrollments, existingRecords] = await Promise.all([
    Enrollment.find({ batchId: session.batchId, status: 'active' }).select('studentId').lean(),
    Attendance.find({ sessionId: session._id }).select('studentId').lean(),
  ]);

  const scannedSet = new Set(existingRecords.map((r) => r.studentId.toString()));
  const absentDocs = enrollments
    .filter((e) => !scannedSet.has(e.studentId.toString()))
    .map((e) => ({
      sessionId: session._id,
      batchId: session.batchId,
      studentId: e.studentId,
      attendanceDate: session.sessionDate,
      status: 'absent',
    }));

  if (absentDocs.length > 0) {
    await Attendance.insertMany(absentDocs, { ordered: false }).catch(() => {});
  }

  await recordAuditLog({
    req,
    action: 'ATTENDANCE_SESSION_CLOSED',
    targetEntity: 'AttendanceSession',
    targetEntityId: session._id,
    metadata: { markedAbsentCount: absentDocs.length },
  });

  return sendSuccess(res, {
    message: `Session closed. ${absentDocs.length} unscanned student(s) marked absent.`,
    data: { session },
  });
});
