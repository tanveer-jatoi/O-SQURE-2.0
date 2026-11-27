import { Router } from 'express';
import {
  listTeachers,
  createTeacher,
  getMyTeacherProfile,
  getTeacherById,
  updateTeacher,
} from '../controllers/teacherController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createTeacherSchema, updateTeacherSchema } from '../validators/teacherValidators.js';

const router = Router();

router.use(protect);

router.get('/me', authorizeRoles('teacher'), getMyTeacherProfile);
router.get('/', authorizeRoles('superadmin', 'admin'), listTeachers);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createTeacherSchema), createTeacher);
router.get('/:id', authorizeRoles('superadmin', 'admin', 'teacher'), getTeacherById);
router.patch('/:id', authorizeRoles('superadmin', 'admin'), validateBody(updateTeacherSchema), updateTeacher);

export default router;
