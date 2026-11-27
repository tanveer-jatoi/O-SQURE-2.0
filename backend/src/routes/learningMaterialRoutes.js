import { Router } from 'express';
import { listLearningMaterials, createLearningMaterial } from '../controllers/campusHubController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createMaterialSchema } from '../validators/campusHubValidators.js';

const router = Router();
router.use(protect);

router.get('/', listLearningMaterials);
router.post('/', authorizeRoles('superadmin', 'admin', 'teacher'), validateBody(createMaterialSchema), createLearningMaterial);

export default router;
