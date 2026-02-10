import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { verifyToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { validate } from '../middleware/validate';
import { createInvitationSchema, inviteByEmailSchema, updateRoleSchema } from '../validations/adminValidation';

const router = Router();

router.use(verifyToken, requireAdmin);

router.post('/invite', validate(inviteByEmailSchema), adminController.inviteByEmail);
router.post('/invitation-codes', validate(createInvitationSchema), adminController.createInvitationCode);
router.get('/invitation-codes', adminController.getInvitationCodes);
router.delete('/invitation-codes/:code', adminController.deleteInvitationCode);
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/role', validate(updateRoleSchema), adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);
router.delete('/posts/:postId', adminController.deletePostAdmin);
router.get('/statistics', adminController.getStatistics);

export default router;
