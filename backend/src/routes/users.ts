import { Router } from 'express';
import * as userController from '../controllers/userController';
import { verifyToken } from '../middleware/auth';
import { upload } from '../config/multer';

const router = Router();

router.use(verifyToken);

router.get('/me', userController.getMe);
router.put('/me', upload.single('profileImage'), userController.updateMe);
router.get('/:userId', userController.getUser);
router.get('/:userId/posts', userController.getUserPosts);
router.get('/:userId/replies', userController.getUserRepliedPosts);
router.get('/:userId/media-posts', userController.getUserMediaPosts);

export default router;
