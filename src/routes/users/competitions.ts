import { Router } from "express";
import {
  getCompetition,
  participantsCompetitions,
  getAllCompetitions,
} from "../../controllers/users/competitions";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { participateCompetitionSchema } from "../../validators/users/competitions";
const router = Router();
router.get("/", catchAsync(getAllCompetitions));

router
  .route("/:id")
  .post(
    validate(participateCompetitionSchema),
    catchAsync(participantsCompetitions)
  )
  .get(catchAsync(getCompetition));
export default router;
