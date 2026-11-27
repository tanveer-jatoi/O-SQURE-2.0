import { Batch } from '../models/Batch.js';
import { Teacher } from '../models/Teacher.js';
import { TeacherAssignment } from '../models/TeacherAssignment.js';
import { Timetable } from '../models/Timetable.js';
import { AppError } from '../utils/appError.js';

const PATTERN_DAYS = {
  MWF: ['Mon', 'Wed', 'Fri'],
  TTS: ['Tue', 'Thu', 'Sat'],
  DAILY: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  WEEKEND: ['Sat', 'Sun'],
};

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function doDayPatternsOverlap(p1, p2) {
  const days1 = PATTERN_DAYS[p1] || [];
  const days2 = PATTERN_DAYS[p2] || [];
  return days1.some((d) => days2.includes(d));
}

export function doTimeRangesOverlap(start1, end1, start2, end2) {
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
}

/**
 * Validates that a batch schedule does not double-book the assigned classroom
 * or the assigned primary teacher across overlapping days and hours.
 */
export async function validateBatchScheduleConflict({
  batchId = null,
  classRoomId,
  assignedTeacherId,
  daysPattern,
  startTime,
  endTime,
}) {
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw new AppError('End time must be after start time.', 400, 'INVALID_TIME_RANGE');
  }

  const query = {
    status: { $in: ['upcoming', 'in_progress'] },
    $or: [{ classRoomId }, { assignedTeacherId }],
  };
  if (batchId) {
    query._id = { $ne: batchId };
  }

  const candidateBatches = await Batch.find(query)
    .populate('classRoomId', 'roomName')
    .populate('assignedTeacherId', 'fullName')
    .lean();

  for (const existing of candidateBatches) {
    if (
      doDayPatternsOverlap(daysPattern, existing.daysPattern) &&
      doTimeRangesOverlap(startTime, endTime, existing.startTime, existing.endTime)
    ) {
      const sameRoom = existing.classRoomId?._id?.toString() === String(classRoomId);
      const resourceLabel = sameRoom
        ? `Classroom "${existing.classRoomId.roomName}"`
        : `Teacher "${existing.assignedTeacherId?.fullName}"`;

      throw new AppError(
        `Schedule conflict: ${resourceLabel} is already booked for batch ${existing.batchCode} (${existing.daysPattern} ${existing.startTime}-${existing.endTime}).`,
        409,
        'SCHEDULE_CONFLICT'
      );
    }
  }
}

/**
 * Resolves all Batch IDs assigned to a Teacher user (either as primary batch
 * teacher or via TeacherAssignment).
 */
export async function getTeacherAssignedBatchIds(teacherUserId) {
  const teacher = await Teacher.findOne({ userId: teacherUserId }).lean();
  if (!teacher) return [];

  const [primaryBatches, extraAssignments] = await Promise.all([
    Batch.find({ assignedTeacherId: teacher._id }).select('_id').lean(),
    TeacherAssignment.find({ teacherId: teacher._id }).select('batchId').lean(),
  ]);

  const ids = new Set([
    ...primaryBatches.map((b) => b._id.toString()),
    ...extraAssignments.map((a) => a.batchId.toString()),
  ]);

  return Array.from(ids);
}

/**
 * Validates that a weekly timetable slot does not conflict with another slot
 * for the same batch, teacher, or classroom on the same day of week.
 */
export async function validateTimetableSlotConflict({
  batchId,
  teacherId,
  classRoomId,
  dayOfWeek,
  startTime,
  endTime,
}) {
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw new AppError('End time must be after start time.', 400, 'INVALID_TIME_RANGE');
  }

  const existingSlots = await Timetable.find({
    dayOfWeek,
    $or: [{ batchId }, { teacherId }, { classRoomId }],
  })
    .populate('batchId', 'batchCode')
    .populate('teacherId', 'fullName')
    .populate('classRoomId', 'roomName')
    .lean();

  for (const slot of existingSlots) {
    if (doTimeRangesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
      throw new AppError(
        `Timetable conflict on ${dayOfWeek} (${slot.startTime}-${slot.endTime}) with batch ${slot.batchId?.batchCode}.`,
        409,
        'TIMETABLE_CONFLICT'
      );
    }
  }
}
