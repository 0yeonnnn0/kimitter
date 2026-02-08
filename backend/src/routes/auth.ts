import { Router } from 'express';
import * as authController from '../controllers/authController';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from '../validations/authValidation';

const router = Router();

router.post('/validate-code', authController.validateCode);
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', verifyToken, authController.logout);
router.post('/password-change', verifyToken, validate(changePasswordSchema), authController.changePassword);

export default router;
