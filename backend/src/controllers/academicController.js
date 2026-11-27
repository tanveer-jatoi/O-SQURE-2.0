import { Course } from '../models/Course.js';
import { Subject } from '../models/Subject.js';
import { ClassRoom } from '../models/ClassRoom.js';
import { Batch } from '../models/Batch.js';
import { Enrollment } from '../models/Enrollment.js';
import { Student } from '../models/Student.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  validateBatchScheduleConflict,
  getTeacherAssignedBatchIds,
} from '../services/scheduleConflictService.js';
import { recordAuditLog } from '../services/auditService.js';

// --- COURSES ---
export const listCourses = catchAsync(async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { message: 'Courses retrieved.', data: { courses } });
});

export const createCourse = catchAsync(async (req, res) => {
  const course = await Course.create(req.body);
  await recordAuditLog({
    req,
    action: 'COURSE_CREATED',
    targetEntity: 'Course',
    targetEntityId: course._id,
    metadata: { courseCode: course.courseCode },
  });
  return sendSuccess(res, { statusCode: 201, message: 'Course created.', data: { course } });
});

// --- SUBJECTS ---
export const listSubjects = catchAsync(async (req, res) => {
  const filter = req.query.courseId ? { courseId: req.query.courseId } : {};
  const subjects = await Subject.find(filter)
    .populate('courseId', 'courseCode title')
    .sort({ semester: 1, subjectCode: 1 })
    .lean();
  return sendSuccess(res, { message: 'Subjects retrieved.', data: { subjects } });
});

export const createSubject = catchAsync(async (req, res) => {
  const subject = await Subject.create(req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Subject created.', data: { subject } });
});

// --- CLASSROOMS ---
export const listClassRooms = catchAsync(async (req, res) => {
  const classRooms = await ClassRoom.find().sort({ roomName: 1 }).lean();
  return sendSuccess(res, { message: 'Classrooms retrieved.', data: { classRooms } });
});

export const createClassRoom = catchAsync(async (req, res) => {
  const classRoom = await ClassRoom.create(req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Classroom created.', data: { classRoom } });
});

// --- BATCHES ---
export const listBatches = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'teacher') {
    const batchIds = await getTeacherAssignedBatchIds(req.user._id);
    filter._id = { $in: batchIds };
  } else if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) {
      return sendSuccess(res, { message: 'Batches retrieved.', data: { batches: [] } });
    }
    const enrollments = await Enrollment.find({ studentId: student._id, status: 'active' }).lean();
    filter._id = { $in: enrollments.map((e) => e.batchId) };
  }

  const batches = await Batch.find(filter)
    .populate('courseId', 'courseCode title')
    .populate('classRoomId', 'roomName roomType')
    .populate('assignedTeacherId', 'teacherId fullName')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { message: 'Batches retrieved.', data: { batches } });
});

export const createBatch = catchAsync(async (req, res) => {
  await validateBatchScheduleConflict({
    classRoomId: req.body.classRoomId,
    assignedTeacherId: req.body.assignedTeacherId,
    daysPattern: req.body.daysPattern,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
  });

  const batch = await Batch.create({
    ...req.body,
    startDate: new Date(req.body.startDate),
    expectedEndDate: new Date(req.body.expectedEndDate),
  });

  await recordAuditLog({
    req,
    action: 'BATCH_CREATED',
    targetEntity: 'Batch',
    targetEntityId: batch._id,
    metadata: { batchCode: batch.batchCode },
  });

  return sendSuccess(res, { statusCode: 201, message: 'Batch created.', data: { batch } });
});

export const getBatchStudents = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (req.user.role === 'teacher') {
    const assignedBatchIds = await getTeacherAssignedBatchIds(req.user._id);
    if (!assignedBatchIds.includes(id)) {
      return next(
        new AppError('Access denied. You are not assigned to this batch.', 403, 'FORBIDDEN_ASSIGNMENT')
      );
    }
  }

  const enrollments = await Enrollment.find({ batchId: id, status: 'active' })
    .populate('studentId', 'studentId fullName fatherName contactPhone academicStatus')
    .sort({ enrollmentDate: -1 })
    .lean();

  return sendSuccess(res, {
    message: 'Batch roster retrieved.',
    data: { enrollments },
  });
});

// --- ENROLLMENTS ---
export const enrollStudent = catchAsync(async (req, res, next) => {
  const { studentId, batchId } = req.body;

  const [student, batch] = await Promise.all([
    Student.findById(studentId),
    Batch.findById(batchId),
  ]);

  if (!student) return next(new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND'));
  if (!batch) return next(new AppError('Batch not found.', 404, 'BATCH_NOT_FOUND'));

  const enrollment = await Enrollment.create({ studentId, batchId, status: 'active' });

  student.currentBatchId = batch._id;
  await student.save();

  await recordAuditLog({
    req,
    action: 'STUDENT_ENROLLED_IN_BATCH',
    targetEntity: 'Enrollment',
    targetEntityId: enrollment._id,
    metadata: { studentId: student.studentId, batchCode: batch.batchCode },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: `Student ${student.fullName} enrolled in batch ${batch.batchCode}.`,
    data: { enrollment },
  });
});
