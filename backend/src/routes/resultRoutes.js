import { Router } from 'express';
import {
  enterBatchMarks,
  listResults,
  getMyPublishedResults,
  downloadMyResultCardPdf,
} from '../controllers/resultController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { enterMarksSchema } from '../validators/examValidators.js';

const router = Router();
router.use(protect);

router.post('/marks', authorizeRoles('superadmin', 'admin', 'teacher'), validateBody(enterMarksSchema), enterBatchMarks);
router.get('/my-results', authorizeRoles('student'), getMyPublishedResults);
router.get('/my-results/:examinationId/pdf', authorizeRoles('student'), downloadMyResultCardPdf);
router.get('/', authorizeRoles('superadmin', 'admin', 'teacher'), listResults);

export default router;
