import { Router } from 'express';
import {
  startAttendanceSession,
  listAttendanceSessions,
  refreshSessionQr,
  getSessionLiveStatus,
  closeAttendanceSession,
} from '../controllers/attendanceSessionController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createAttendanceSessionSchema } from '../validators/attendanceValidators.js';

const router = Router();

router.use(protect);
router.use(authorizeRoles('superadmin', 'admin', 'teacher'));

router.get('/', listAttendanceSessions);
router.post('/', validateBody(createAttendanceSessionSchema), startAttendanceSession);
router.get('/:id/qr', refreshSessionQr);
router.get('/:id/live', getSessionLiveStatus);
router.patch('/:id/close', closeAttendanceSession);

export default router;
