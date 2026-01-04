import { Request, Response, Router } from 'express';
import { authenticated } from '../../middlewares/authenticated';
import { getAllNotifications, getUnseenCount, getNotificationById } from '../../controllers/users/Notification';
import { catchAsync } from '../../utils/catchAsync';

const router = Router();
router.get('/', authenticated, catchAsync(getAllNotifications));
router.get('/unseen-count', authenticated, catchAsync(getUnseenCount));
router.get('/:id', authenticated, catchAsync(getNotificationById));
export default router;

