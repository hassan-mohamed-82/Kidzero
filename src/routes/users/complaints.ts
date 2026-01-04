import { Router } from "express";
import { validate } from "../../middlewares/validation";
import { catchAsync } from "../../utils/catchAsync";
import {
  createComplaints,
  getComplaintsCategory,
} from "../../controllers/users/complaints";
import { createComplaintSchema } from "../../validators/users/complaints";
const router = Router();
router
  .route("/")
  .post(validate(createComplaintSchema), catchAsync(createComplaints))
  .get(catchAsync(getComplaintsCategory));
export default router;
