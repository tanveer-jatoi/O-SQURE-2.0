import { Router } from 'express';
import {
  scanQrAttendance,
  getMyAttendanceHistory,
  listAttendanceRecords,
  correctAttendanceRecord,
} from '../controllers/attendanceController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { qrScanLimiter } from '../middleware/rateLimiters.js';
import { validateBody } from '../middleware/validateRequest.js';
import { scanQrSchema, manualCorrectionSchema } from '../validators/attendanceValidators.js';

const router = Router();

router.use(protect);

router.post('/scan', authorizeRoles('student'), qrScanLimiter, validateBody(scanQrSchema), scanQrAttendance);
router.get('/my-history', authorizeRoles('student'), getMyAttendanceHistory);
router.get('/', authorizeRoles('superadmin', 'admin', 'teacher'), listAttendanceRecords);
router.patch('/:id', authorizeRoles('superadmin', 'admin'), validateBody(manualCorrectionSchema), correctAttendanceRecord);

export default router;
