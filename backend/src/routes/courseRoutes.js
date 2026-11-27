import { Router } from 'express';
import { listCourses, createCourse } from '../controllers/academicController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createCourseSchema } from '../validators/academicValidators.js';

const router = Router();
router.use(protect);

router.get('/', listCourses);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createCourseSchema), createCourse);

export default router;
