import { Router } from 'express';
import * as likeController from '../controllers/likeController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.post('/posts/:postId', likeController.togglePostLike);
router.get('/posts/:postId', likeController.getPostLikes);
router.post('/comments/:commentId', likeController.toggleCommentLike);
router.get('/comments/:commentId', likeController.getCommentLikes);

export default router;
