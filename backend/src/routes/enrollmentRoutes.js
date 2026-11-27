import { Router } from 'express';
import { enrollStudent } from '../controllers/academicController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createEnrollmentSchema } from '../validators/academicValidators.js';

const router = Router();
router.use(protect);

router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createEnrollmentSchema), enrollStudent);

export default router;
