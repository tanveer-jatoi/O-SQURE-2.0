import { Announcement } from '../models/Announcement.js';
import { LearningMaterial } from '../models/LearningMaterial.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { Student } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getTeacherAssignedBatchIds } from '../services/scheduleConflictService.js';
import { recordAuditLog } from '../services/auditService.js';

// --- ANNOUNCEMENTS ---
export const listAnnouncements = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'teacher') {
    filter.targetRole = { $in: ['all', 'teachers'] };
  } else if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    const enrollments = student
      ? await Enrollment.find({ studentId: student._id, status: 'active' }).lean()
      : [];
    const batchIds = enrollments.map((e) => e.batchId);
    filter.$or = [
      { targetRole: { $in: ['all', 'students'] } },
      { targetRole: 'batch_specific', targetBatchId: { $in: batchIds } },
    ];
  }

  const announcements = await Announcement.find(filter)
    .populate('authorId', 'fullName role')
    .populate('targetBatchId', 'batchCode')
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(50)
    .lean();

  return sendSuccess(res, { message: 'Announcements retrieved.', data: { announcements } });
});

export const createAnnouncement = catchAsync(async (req, res) => {
  const announcement = await Announcement.create({
    ...req.body,
    targetBatchId: req.body.targetBatchId || null,
    authorId: req.user._id,
  });

  await recordAuditLog({
    req,
    action: 'ANNOUNCEMENT_PUBLISHED',
    targetEntity: 'Announcement',
    targetEntityId: announcement._id,
    metadata: { title: announcement.title, targetRole: announcement.targetRole },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Announcement published.',
    data: { announcement },
  });
});

// --- LEARNING MATERIALS ---
export const listLearningMaterials = catchAsync(async (req, res) => {
  const filter = {};

  if (req.user.role === 'teacher') {
    const batchIds = await getTeacherAssignedBatchIds(req.user._id);
    filter.batchId = { $in: batchIds };
  } else if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) return sendSuccess(res, { message: 'Materials retrieved.', data: { materials: [] } });
    const enrollments = await Enrollment.find({ studentId: student._id, status: 'active' }).lean();
    filter.batchId = { $in: enrollments.map((e) => e.batchId) };
  }

  const materials = await LearningMaterial.find(filter)
    .populate('batchId', 'batchCode')
    .populate('subjectId', 'subjectCode title')
    .populate('uploadedByUserId', 'fullName')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return sendSuccess(res, { message: 'Learning materials retrieved.', data: { materials } });
});

export const createLearningMaterial = catchAsync(async (req, res, next) => {
  if (req.user.role === 'teacher') {
    const batchIds = await getTeacherAssignedBatchIds(req.user._id);
    if (!batchIds.includes(req.body.batchId)) {
      return next(
        new AppError('Access denied. You can only upload materials for assigned batches.', 403, 'FORBIDDEN_ASSIGNMENT')
      );
    }
  }

  const material = await LearningMaterial.create({
    ...req.body,
    uploadedByUserId: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Learning material added.',
    data: { material },
  });
});

// --- SYSTEM SETTINGS ---
export const getSystemSettings = catchAsync(async (req, res) => {
  let settings = await SystemSetting.findOne({ key: 'global' }).lean();
  if (!settings) {
    settings = await SystemSetting.create({ key: 'global' });
  }
  return sendSuccess(res, { message: 'System settings retrieved.', data: { settings } });
});

export const updateSystemSettings = catchAsync(async (req, res) => {
  const settings = await SystemSetting.findOneAndUpdate(
    { key: 'global' },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );

  await recordAuditLog({
    req,
    action: 'SYSTEM_SETTINGS_UPDATED',
    targetEntity: 'SystemSetting',
    targetEntityId: settings._id,
    metadata: { updatedKeys: Object.keys(req.body) },
  });

  return sendSuccess(res, { message: 'System settings updated.', data: { settings } });
});
