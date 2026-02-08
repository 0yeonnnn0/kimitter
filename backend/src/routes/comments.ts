import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentSchema, updateCommentSchema } from '../validations/commentValidation';

const router = Router();

router.use(verifyToken);

router.post('/post/:postId', validate(createCommentSchema), commentController.createComment);
router.get('/post/:postId', commentController.getCommentsByPost);
router.put('/:commentId', validate(updateCommentSchema), commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);
router.post('/:commentId/replies', validate(createCommentSchema), commentController.createReply);

export default router;
