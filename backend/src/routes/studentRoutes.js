import { Router } from 'express';
import {
  listStudents,
  createStudent,
  getMyStudentProfile,
  getStudentById,
  updateStudent,
} from '../controllers/studentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createStudentSchema, updateStudentSchema } from '../validators/studentValidators.js';

const router = Router();

router.use(protect);

router.get('/me', authorizeRoles('student'), getMyStudentProfile);
router.get('/', authorizeRoles('superadmin', 'admin', 'teacher'), listStudents);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createStudentSchema), createStudent);
router.get('/:id', authorizeRoles('superadmin', 'admin', 'teacher', 'student'), getStudentById);
router.patch('/:id', authorizeRoles('superadmin', 'admin'), validateBody(updateStudentSchema), updateStudent);

export default router;
