import { Router } from 'express';
import {
  listExaminations,
  createExamination,
  listExamSubjects,
  addExamSubject,
  togglePublishExamination,
} from '../controllers/examController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import {
  createExamSchema,
  addExamSubjectSchema,
  publishExamSchema,
} from '../validators/examValidators.js';

const router = Router();
router.use(protect);

router.get('/', listExaminations);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createExamSchema), createExamination);
router.get('/:id/subjects', listExamSubjects);
router.post('/:id/subjects', authorizeRoles('superadmin', 'admin'), validateBody(addExamSubjectSchema), addExamSubject);
router.patch('/:id/publish', authorizeRoles('superadmin', 'admin'), validateBody(publishExamSchema), togglePublishExamination);

export default router;
