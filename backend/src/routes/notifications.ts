import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendNotificationSchema, registerTokenSchema } from '../validations/notificationValidation';

const router = Router();

router.use(verifyToken);

router.get('/', notificationController.getNotifications);
router.get('/unread', notificationController.getUnreadNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:notificationId', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.post('/posts/:postId/notify', validate(sendNotificationSchema), notificationController.sendPostNotification);
router.post('/register-token', validate(registerTokenSchema), notificationController.registerToken);

export default router;
