import { Router } from 'express';
import { handlePaymentWebhook } from '../controllers/paymentController.js';

const router = Router();

// Protected via HMAC-SHA256 x-osquare-signature header verification
router.post('/', handlePaymentWebhook);

export default router;
