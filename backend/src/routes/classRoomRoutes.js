import { Router } from 'express';
import { listClassRooms, createClassRoom } from '../controllers/academicController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createClassRoomSchema } from '../validators/academicValidators.js';

const router = Router();
router.use(protect);

router.get('/', authorizeRoles('superadmin', 'admin', 'teacher'), listClassRooms);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createClassRoomSchema), createClassRoom);

export default router;
