import { Router } from "express";
import {
  getAllComplaints,
  getComplaint,
  makeComplaintSeen,
  deleteComplaint,
  changeComplaintStatus,
} from "../../controllers/admin/complaints";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.route("/").get(catchAsync(getAllComplaints));
router
  .route("/:id")
  .get(catchAsync(getComplaint))
  .put(catchAsync(makeComplaintSeen))
  .delete(catchAsync(deleteComplaint));
router.post("/:id/status", catchAsync(changeComplaintStatus));

export default router;
