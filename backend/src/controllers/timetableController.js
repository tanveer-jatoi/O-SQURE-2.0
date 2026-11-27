import { Timetable } from '../models/Timetable.js';
import { Teacher } from '../models/Teacher.js';
import { Student } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { validateTimetableSlotConflict } from '../services/scheduleConflictService.js';
import { recordAuditLog } from '../services/auditService.js';

export const listTimetable = catchAsync(async (req, res) => {
  const filter = {};

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) return sendSuccess(res, { message: 'Timetable retrieved.', data: { slots: [] } });
    filter.teacherId = teacher._id;
  } else if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) return sendSuccess(res, { message: 'Timetable retrieved.', data: { slots: [] } });
    const enrollments = await Enrollment.find({ studentId: student._id, status: 'active' }).lean();
    filter.batchId = { $in: enrollments.map((e) => e.batchId) };
  } else if (req.query.batchId) {
    filter.batchId = req.query.batchId;
  }

  const slots = await Timetable.find(filter)
    .populate('batchId', 'batchCode')
    .populate('courseId', 'courseCode')
    .populate('subjectId', 'subjectCode title')
    .populate('teacherId', 'fullName')
    .populate('classRoomId', 'roomName')
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean();

  return sendSuccess(res, { message: 'Timetable retrieved.', data: { slots } });
});

export const createTimetableSlot = catchAsync(async (req, res) => {
  await validateTimetableSlotConflict(req.body);
  const slot = await Timetable.create(req.body);

  await recordAuditLog({
    req,
    action: 'TIMETABLE_SLOT_CREATED',
    targetEntity: 'Timetable',
    targetEntityId: slot._id,
    metadata: { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Timetable slot added.',
    data: { slot },
  });
});

export const deleteTimetableSlot = catchAsync(async (req, res, next) => {
  const slot = await Timetable.findByIdAndDelete(req.params.id);
  if (!slot) return next(new AppError('Timetable slot not found.', 404, 'SLOT_NOT_FOUND'));

  return sendSuccess(res, { message: 'Timetable slot removed.', data: null });
});
