import { Router } from 'express';
import * as activityController from '../controllers/activityController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.get('/', activityController.getAllActivity);
router.get('/likes', activityController.getLikesActivity);
router.get('/comments', activityController.getCommentsActivity);
router.get('/notifications', activityController.getNotificationsActivity);

export default router;
