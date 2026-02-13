import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createScheduleSchema, updateScheduleSchema } from '../validations/scheduleValidation';

const router = Router();

router.use(verifyToken);

router.get('/', scheduleController.getByMonth);
router.get('/date', scheduleController.getByDate);
router.post('/', validate(createScheduleSchema), scheduleController.create);
router.put('/:id', validate(updateScheduleSchema), scheduleController.update);
router.delete('/:id', scheduleController.remove);

export default router;
