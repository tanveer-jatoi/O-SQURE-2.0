import { Router } from 'express';
import {
  listVouchers,
  generateVoucher,
  applyLateFine,
  downloadVoucherPdf,
} from '../controllers/voucherController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import {
  generateVoucherSchema,
  applyLateFineSchema,
} from '../validators/feeValidators.js';

const router = Router();
router.use(protect);

router.get('/', authorizeRoles('superadmin', 'admin', 'student'), listVouchers);
router.get('/:id/pdf', authorizeRoles('superadmin', 'admin', 'student'), downloadVoucherPdf);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(generateVoucherSchema), generateVoucher);
router.patch('/:id/late-fine', authorizeRoles('superadmin', 'admin'), validateBody(applyLateFineSchema), applyLateFine);

export default router;
