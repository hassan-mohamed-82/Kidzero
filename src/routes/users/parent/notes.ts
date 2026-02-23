import { Router } from "express";
import { getAllNotes, getNoteById, getUpcomingNotes } from "../../../controllers/users/parent/notes";
import { catchAsync } from "../../../utils/catchAsync";
const router = Router();

router.get("/upcoming", catchAsync(getUpcomingNotes));
router.get("/", catchAsync(getAllNotes));
router.get("/:id", catchAsync(getNoteById));
export default router;