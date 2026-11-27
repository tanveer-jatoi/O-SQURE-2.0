import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditLogController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/', authorizeRoles('superadmin', 'admin'), listAuditLogs);

export default router;
