import { Router } from 'express';
import {
  initiateCheckout,
  recordManualPayment,
  listPayments,
  refundPayment,
} from '../controllers/paymentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import {
  initiateCheckoutSchema,
  recordManualPaymentSchema,
  refundPaymentSchema,
} from '../validators/paymentValidators.js';

const router = Router();
router.use(protect);

router.get('/', authorizeRoles('superadmin', 'admin', 'student'), listPayments);
router.post('/checkout', authorizeRoles('student'), validateBody(initiateCheckoutSchema), initiateCheckout);
router.post('/manual', authorizeRoles('superadmin', 'admin'), validateBody(recordManualPaymentSchema), recordManualPayment);
router.post('/:id/refund', authorizeRoles('superadmin', 'admin'), validateBody(refundPaymentSchema), refundPayment);

export default router;
