import { Router } from 'express';
import {
  listAdmissions,
  createAdmission,
  updateAdmissionStatus,
  convertAdmissionToStudent,
} from '../controllers/admissionController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import {
  createAdmissionSchema,
  updateAdmissionStatusSchema,
  convertAdmissionSchema,
} from '../validators/admissionValidators.js';

const router = Router();

router.use(protect);
router.use(authorizeRoles('superadmin', 'admin'));

router.get('/', listAdmissions);
router.post('/', validateBody(createAdmissionSchema), createAdmission);
router.patch('/:id/status', validateBody(updateAdmissionStatusSchema), updateAdmissionStatus);
router.post('/:id/convert', validateBody(convertAdmissionSchema), convertAdmissionToStudent);

export default router;
