import { Router } from 'express';
import authRouter from './auth';
import userRouter from './users';
import postRouter from './posts';
import commentRouter from './comments';
import likeRouter from './likes';
import tagRouter from './tags';
import notificationRouter from './notifications';
import activityRouter from './activity';
import adminRouter from './admin';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);
router.use('/likes', likeRouter);
router.use('/tags', tagRouter);
router.use('/notifications', notificationRouter);
router.use('/activity', activityRouter);
router.use('/admin', adminRouter);

export default router;
