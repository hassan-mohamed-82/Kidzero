import { Router } from "express";
import {
  getVote,
  getAllVotes,
  createVote,
  deleteVote,
  updateVote,
  // getAllOptions,
  // getOption,
  // createOption,
  // updateOption,
  // deleteOption,
} from "../../controllers/admin/votes";
import { voteResult } from "../../controllers/users/votes";
import { validate } from "../../middlewares/validation";
import { catchAsync } from "../../utils/catchAsync";
import {
  createFullVoteSchema,
  updateVoteSchema,
} from "../../validators/admin/votes";
const router = Router();

// Create Vote and get all votes
router.post("/", validate(createFullVoteSchema), catchAsync(createVote));
router.get("/", catchAsync(getAllVotes));

// Get All options, Edit and delete option
// router
//   .route("/items")
//   .get(catchAsync(getAllOptions))
//   .post(catchAsync(createOption));

// // Get option by id and delete option
// router
//   .route("/items/:id")
//   .get(catchAsync(getOption))
//   .delete(catchAsync(deleteOption))
//   .put(catchAsync(updateOption));

// Get vote result
router.get("/:id/result", catchAsync(voteResult));

// Get, Edit and delete vote
router
  .route("/:id")
  .get(catchAsync(getVote))
  .put(validate(updateVoteSchema), catchAsync(updateVote))
  .delete(catchAsync(deleteVote));

export default router;
