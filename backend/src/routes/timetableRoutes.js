import { Router } from 'express';
import {
  listTimetable,
  createTimetableSlot,
  deleteTimetableSlot,
} from '../controllers/timetableController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createTimetableSlotSchema } from '../validators/campusHubValidators.js';

const router = Router();
router.use(protect);

router.get('/', listTimetable);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createTimetableSlotSchema), createTimetableSlot);
router.delete('/:id', authorizeRoles('superadmin', 'admin'), deleteTimetableSlot);

export default router;
