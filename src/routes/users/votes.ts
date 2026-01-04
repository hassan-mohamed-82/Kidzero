import { Router } from "express";
import {
  getAllVotes,
  getVote,
  submitVote,
  voteResult,
} from "../../controllers/users/votes";
import { validate } from "../../middlewares/validation";
import { catchAsync } from "../../utils/catchAsync";
import { submitVoteSchema } from "../../validators/users/votes";
const router = Router();
router.get("/", catchAsync(getAllVotes));
router.get("/:id/result", catchAsync(voteResult));
router
  .route("/:id")
  .get(catchAsync(getVote))
  .post(validate(submitVoteSchema), catchAsync(submitVote));
export default router;
