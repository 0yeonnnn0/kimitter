import { Router } from 'express';
import * as postController from '../controllers/postController';
import * as likeController from '../controllers/likeController';
import { verifyToken } from '../middleware/auth';
import { upload } from '../config/multer';

const router = Router();

router.use(verifyToken);

router.get('/search', postController.searchPosts);
router.get('/', postController.getPosts);
router.post('/', upload.array('media', 10), postController.createPost);
router.get('/:postId', postController.getPostById);
router.put('/:postId', postController.updatePost);
router.delete('/:postId', postController.deletePost);
router.post('/:postId/like', likeController.togglePostLike);
router.delete('/:postId/like', likeController.togglePostLike);

export default router;
