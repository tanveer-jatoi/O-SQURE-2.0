import { Router } from 'express';
import { listBatches, createBatch, getBatchStudents } from '../controllers/academicController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createBatchSchema } from '../validators/academicValidators.js';

const router = Router();
router.use(protect);

router.get('/', listBatches);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createBatchSchema), createBatch);
router.get('/:id/students', authorizeRoles('superadmin', 'admin', 'teacher'), getBatchStudents);

export default router;
