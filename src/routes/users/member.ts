import { Router } from "express";
import {
  getAllMembers,
  getMember,
} from "../../controllers/users/member";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();

router
  .route("/")
  .get(catchAsync(getAllMembers))


router
  .route("/:id")
  .get(catchAsync(getMember))

export default router;
