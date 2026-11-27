import { Router } from 'express';
import {
  listFeeStructures,
  createFeeStructure,
  listStudentFeeAccounts,
  assignStudentFeeAccount,
  getMyFeeSummary,
} from '../controllers/feeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import {
  createFeeStructureSchema,
  assignStudentFeeSchema,
} from '../validators/feeValidators.js';

const router = Router();
router.use(protect);

router.get('/my-summary', authorizeRoles('student'), getMyFeeSummary);
router.get('/structures', authorizeRoles('superadmin', 'admin'), listFeeStructures);
router.post('/structures', authorizeRoles('superadmin', 'admin'), validateBody(createFeeStructureSchema), createFeeStructure);
router.get('/accounts', authorizeRoles('superadmin', 'admin'), listStudentFeeAccounts);
router.post('/accounts/assign', authorizeRoles('superadmin', 'admin'), validateBody(assignStudentFeeSchema), assignStudentFeeAccount);

export default router;
