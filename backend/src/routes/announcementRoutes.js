import { Router } from 'express';
import { listAnnouncements, createAnnouncement } from '../controllers/campusHubController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createAnnouncementSchema } from '../validators/campusHubValidators.js';

const router = Router();
router.use(protect);

router.get('/', listAnnouncements);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createAnnouncementSchema), createAnnouncement);

export default router;
