import { Router } from 'express';
import * as postController from '../controllers/postController';
import { verifyToken } from '../middleware/auth';
import { upload } from '../config/multer';

const router = Router();

router.use(verifyToken);

router.get('/search', postController.searchPosts);
router.get('/', postController.getPosts);
router.post('/', upload.array('files', 10), postController.createPost);
router.get('/:postId', postController.getPostById);
router.put('/:postId', postController.updatePost);
router.delete('/:postId', postController.deletePost);

export default router;
