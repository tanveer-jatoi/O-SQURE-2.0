import { Examination } from '../models/Examination.js';
import { ExamSubject } from '../models/ExamSubject.js';
import { Result } from '../models/Result.js';
import { Batch } from '../models/Batch.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateCode } from '../utils/idGenerator.js';
import { getTeacherAssignedBatchIds } from '../services/scheduleConflictService.js';
import { recordAuditLog } from '../services/auditService.js';

export const listExaminations = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') {
    filter.isPublished = true;
  } else if (req.user.role === 'teacher') {
    const batchIds = await getTeacherAssignedBatchIds(req.user._id);
    const batches = await Batch.find({ _id: { $in: batchIds } }).select('courseId').lean();
    filter.courseId = { $in: batches.map((b) => b.courseId) };
  }

  const examinations = await Examination.find(filter)
    .populate('courseId', 'courseCode title')
    .sort({ startDate: -1 })
    .lean();

  return sendSuccess(res, {
    message: 'Examinations retrieved.',
    data: { examinations },
  });
});

export const createExamination = catchAsync(async (req, res) => {
  const exam = await Examination.create({
    ...req.body,
    examCode: generateCode('EXM'),
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
  });

  await recordAuditLog({
    req,
    action: 'EXAMINATION_CREATED',
    targetEntity: 'Examination',
    targetEntityId: exam._id,
    metadata: { examCode: exam.examCode, title: exam.title },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Examination scheduled.',
    data: { examination: exam },
  });
});

export const listExamSubjects = catchAsync(async (req, res) => {
  const examSubjects = await ExamSubject.find({ examinationId: req.params.id })
    .populate('subjectId', 'subjectCode title semester')
    .sort({ examDate: 1 })
    .lean();

  return sendSuccess(res, {
    message: 'Exam subjects retrieved.',
    data: { examSubjects },
  });
});

export const addExamSubject = catchAsync(async (req, res, next) => {
  const exam = await Examination.findById(req.params.id);
  if (!exam) return next(new AppError('Examination not found.', 404, 'EXAM_NOT_FOUND'));

  if (req.body.passingMarks > req.body.totalMarks) {
    return next(
      new AppError('Passing marks cannot exceed total marks.', 400, 'INVALID_MARKS_CONFIG')
    );
  }

  const examSubject = await ExamSubject.create({
    examinationId: exam._id,
    ...req.body,
    examDate: new Date(req.body.examDate),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Subject added to examination schedule.',
    data: { examSubject },
  });
});

export const togglePublishExamination = catchAsync(async (req, res, next) => {
  const exam = await Examination.findById(req.params.id);
  if (!exam) return next(new AppError('Examination not found.', 404, 'EXAM_NOT_FOUND'));

  exam.isPublished = req.body.isPublished;
  await exam.save();

  await Result.updateMany(
    { examinationId: exam._id },
    { $set: { isPublished: req.body.isPublished } }
  );

  await recordAuditLog({
    req,
    action: req.body.isPublished ? 'EXAM_RESULTS_PUBLISHED' : 'EXAM_RESULTS_UNPUBLISHED',
    targetEntity: 'Examination',
    targetEntityId: exam._id,
    metadata: { examCode: exam.examCode },
  });

  return sendSuccess(res, {
    message: `Examination results ${exam.isPublished ? 'published' : 'unpublished'}.`,
    data: { examination: exam },
  });
});
