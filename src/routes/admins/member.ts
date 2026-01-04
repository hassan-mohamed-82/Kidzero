import { Router } from "express";
import {
  createMember,
  getAllMembers,
  getMember,
  updateMember,
  deleteMember,
} from "../../controllers/admin/member";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import {
  CreateMemberSchema,UpdateMemberSchema} from "../../validators/admin/member";

const router = Router();

router
  .route("/")
  .get(catchAsync(getAllMembers))
  .post(validate(CreateMemberSchema), catchAsync(createMember));

router
  .route("/:id")
  .get(catchAsync(getMember))
  .put(validate(UpdateMemberSchema), catchAsync(updateMember))
  .delete(catchAsync(deleteMember));

export default router;
