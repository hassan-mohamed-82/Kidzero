import { Router } from "express";
import {
  getCompetition,
  getAllCompetitions,
  getCompetitionImages,
  getCompetitionUsers,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  removeCompetitionUser,
} from "../../controllers/admin/competitions";
import {
  createCompetitionSchema,
  updateCompetitionSchema,
  removeUserSchema,
} from "../../validators/admin/competitions";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
const router = Router();
router
  .route("/")
  .get(catchAsync(getAllCompetitions))
  .post(validate(createCompetitionSchema), catchAsync(createCompetition));

router.delete(
  "/:id/users/:userId",
  validate(removeUserSchema),
  catchAsync(removeCompetitionUser)
);
router.delete("/:id/users/:userId", catchAsync(removeCompetitionUser));
router.get("/:id/users", catchAsync(getCompetitionUsers));
router.get("/:id/images", catchAsync(getCompetitionImages));
router
  .route("/:id")
  .get(catchAsync(getCompetition))
  .delete(catchAsync(deleteCompetition))
  .put(validate(updateCompetitionSchema), catchAsync(updateCompetition));

export default router;
