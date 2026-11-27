import { Router } from 'express';
import { listSubjects, createSubject } from '../controllers/academicController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createSubjectSchema } from '../validators/academicValidators.js';

const router = Router();
router.use(protect);

router.get('/', listSubjects);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createSubjectSchema), createSubject);

export default router;
