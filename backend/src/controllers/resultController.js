import { ExamSubject } from '../models/ExamSubject.js';
import { Examination } from '../models/Examination.js';
import { Result } from '../models/Result.js';
import { Student } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { calculateGrade } from '../services/gradingService.js';
import { getTeacherAssignedBatchIds } from '../services/scheduleConflictService.js';
import { streamResultCardPdf } from '../services/pdfResultService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * POST /api/v1/results/marks
 * Bulk marks entry for a batch + examSubject. Teachers restricted to assigned batches.
 */
export const enterBatchMarks = catchAsync(async (req, res, next) => {
  const { examSubjectId, batchId, entries } = req.body;

  if (req.user.role === 'teacher') {
    const assignedIds = await getTeacherAssignedBatchIds(req.user._id);
    if (!assignedIds.includes(batchId)) {
      return next(
        new AppError('Access denied. You are not assigned to this batch.', 403, 'FORBIDDEN_ASSIGNMENT')
      );
    }
  }

  const examSubject = await ExamSubject.findById(examSubjectId).populate('examinationId');
  if (!examSubject) {
    return next(new AppError('Scheduled exam subject not found.', 404, 'EXAM_SUBJECT_NOT_FOUND'));
  }

  const enrolled = await Enrollment.find({ batchId, status: 'active' }).select('studentId').lean();
  const enrolledSet = new Set(enrolled.map((e) => e.studentId.toString()));

  const ops = entries.map((entry) => {
    if (!enrolledSet.has(entry.studentId)) {
      throw new AppError(
        `Student ${entry.studentId} is not actively enrolled in this batch.`,
        400,
        'STUDENT_NOT_IN_BATCH'
      );
    }

    const graded = calculateGrade({
      marksObtained: entry.marksObtained,
      totalMarks: examSubject.totalMarks,
      passingMarks: examSubject.passingMarks,
      isAbsent: entry.isAbsent,
    });

    return {
      updateOne: {
        filter: { examSubjectId: examSubject._id, studentId: entry.studentId },
        update: {
          $set: {
            examinationId: examSubject.examinationId._id,
            examSubjectId: examSubject._id,
            studentId: entry.studentId,
            batchId,
            marksObtained: graded.marksObtained,
            percentage: graded.percentage,
            grade: graded.grade,
            isAbsent: Boolean(entry.isAbsent),
            enteredByUserId: req.user._id,
            isPublished: Boolean(examSubject.examinationId.isPublished),
          },
        },
        upsert: true,
      },
    };
  });

  await Result.bulkWrite(ops);

  await recordAuditLog({
    req,
    action: 'EXAM_MARKS_RECORDED',
    targetEntity: 'Result',
    targetEntityId: examSubject._id,
    metadata: { batchId, count: entries.length },
  });

  return sendSuccess(res, {
    message: `Marks saved and graded for ${entries.length} student(s).`,
    data: { count: entries.length },
  });
});

/**
 * GET /api/v1/results
 * Admin & Teacher results viewer (Teachers scoped to assigned batches).
 */
export const listResults = catchAsync(async (req, res) => {
  const { examinationId, batchId } = req.query;
  const filter = {};
  if (examinationId) filter.examinationId = examinationId;

  if (req.user.role === 'teacher') {
    const assignedIds = await getTeacherAssignedBatchIds(req.user._id);
    filter.batchId = batchId
      ? assignedIds.includes(batchId)
        ? batchId
        : null
      : { $in: assignedIds };
  } else if (batchId) {
    filter.batchId = batchId;
  }

  const results = await Result.find(filter)
    .populate('studentId', 'studentId fullName')
    .populate({ path: 'examSubjectId', populate: { path: 'subjectId', select: 'subjectCode title' } })
    .populate('examinationId', 'examCode title isPublished')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return sendSuccess(res, {
    message: 'Results retrieved.',
    data: { results },
  });
});

/**
 * GET /api/v1/results/my-results
 * Student views only their own published results.
 */
export const getMyPublishedResults = catchAsync(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user._id }).lean();
  if (!student) return next(new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND'));

  const results = await Result.find({ studentId: student._id, isPublished: true })
    .populate('examinationId', 'examCode title term startDate')
    .populate({
      path: 'examSubjectId',
      populate: { path: 'subjectId', select: 'subjectCode title' },
    })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: 'Published results retrieved.',
    data: { results },
  });
});

/**
 * GET /api/v1/results/my-results/:examinationId/pdf
 * Streams printable A4 Result Card PDF for a published examination.
 */
export const downloadMyResultCardPdf = catchAsync(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user._id }).lean();
  if (!student) return next(new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND'));

  const examination = await Examination.findOne({
    _id: req.params.examinationId,
    isPublished: true,
  }).lean();
  if (!examination) {
    return next(new AppError('Published examination not found.', 404, 'EXAM_NOT_FOUND'));
  }

  const results = await Result.find({
    studentId: student._id,
    examinationId: examination._id,
    isPublished: true,
  })
    .populate({
      path: 'examSubjectId',
      populate: { path: 'subjectId', select: 'subjectCode title' },
    })
    .lean();

  if (results.length === 0) {
    return next(new AppError('No published results found for this exam.', 404, 'RESULTS_NOT_FOUND'));
  }

  return streamResultCardPdf(res, { student, examination, results });
});
