import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.get('/', tagController.getAllTags);
router.get('/popular', tagController.getPopularTags);
router.get('/search', tagController.searchTags);
router.get('/:tagName/posts', tagController.getPostsByTag);

export default router;
