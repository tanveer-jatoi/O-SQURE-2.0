import { Router } from 'express';
import { getReportsOverview, exportReport } from '../controllers/reportController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.use(authorizeRoles('superadmin', 'admin'));

router.get('/overview', getReportsOverview);
router.get('/export', exportReport);

export default router;
