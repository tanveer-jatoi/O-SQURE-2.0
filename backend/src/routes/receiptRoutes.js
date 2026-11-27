import { Router } from 'express';
import { listReceipts, downloadReceiptPdf } from '../controllers/paymentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/', authorizeRoles('superadmin', 'admin', 'student'), listReceipts);
router.get('/:id/pdf', authorizeRoles('superadmin', 'admin', 'student'), downloadReceiptPdf);

export default router;
