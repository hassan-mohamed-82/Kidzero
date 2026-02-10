import { Router } from "express";
import { getAllNotes, getNoteById } from "../../../controllers/users/parent/notes";
import { catchAsync } from "../../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getAllNotes));
router.get("/:id", catchAsync(getNoteById));
export default router;