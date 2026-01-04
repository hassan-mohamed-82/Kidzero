import { Router, Request, Response } from 'express';
import { authenticated } from '../../middlewares/authenticated';
import { sendNotificationToAll, getAllNotifications,getNotificationById,deleteNotification,updateNotification} from '../../controllers/admin/Notification';
import { createNotificationSchema,updateNotificationSchema } from '../../validators/admin/notification';
import { validate } from '../../middlewares/validation';
import { catchAsync } from '../../utils/catchAsync';
import { authorizeRoles } from '../../middlewares/authorized';

const router = Router();

router.post('/send',authenticated ,authorizeRoles('admin'), validate(createNotificationSchema), catchAsync(sendNotificationToAll));
router.get('/', authenticated ,authorizeRoles('admin'), catchAsync(getAllNotifications));
router.get('/:id',authenticated , authorizeRoles('admin'), catchAsync(getNotificationById));
router.put('/:id',authenticated , authorizeRoles('admin'), validate(updateNotificationSchema), catchAsync(updateNotification));
router.delete('/:id', authenticated ,authorizeRoles('admin'), catchAsync(deleteNotification));

export default router;