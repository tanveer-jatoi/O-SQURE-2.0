import { Router } from 'express';
import {
  listUsers,
  createUser,
  getUserById,
  updateUserStatus,
} from '../controllers/userController.js';
import {
  protect,
  authorizeRoles,
  authorizeSelfOrRoles,
} from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createUserSchema, updateUserStatusSchema } from '../validators/userValidators.js';

const router = Router();

// All routes in /api/v1/users require an authenticated user
router.use(protect);

router.get('/', authorizeRoles('superadmin', 'admin'), listUsers);
router.post('/', authorizeRoles('superadmin', 'admin'), validateBody(createUserSchema), createUser);
router.get('/:id', authorizeSelfOrRoles('id', 'superadmin', 'admin'), getUserById);
router.patch(
  '/:id/status',
  authorizeRoles('superadmin', 'admin'),
  validateBody(updateUserStatusSchema),
  updateUserStatus
);

export default router;
