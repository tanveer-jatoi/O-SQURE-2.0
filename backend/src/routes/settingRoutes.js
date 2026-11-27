import { Router } from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/campusHubController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { updateSettingsSchema } from '../validators/campusHubValidators.js';

const router = Router();
router.use(protect);

router.get('/', authorizeRoles('superadmin', 'admin'), getSystemSettings);
router.patch('/', authorizeRoles('superadmin'), validateBody(updateSettingsSchema), updateSystemSettings);

export default router;
