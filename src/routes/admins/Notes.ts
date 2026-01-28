// src/routes/admin/noteRoutes.ts

import { Router } from "express";
import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getUpcomingNotes,
} from "../../controllers/admin/Notes";
import { catchAsync } from "../../utils/catchAsync";
import { checkPermission } from "../../middlewares/checkpermission";

const router = Router();

// ✅ Static routes first
router.get("/upcoming", checkPermission("notes", "View"), catchAsync(getUpcomingNotes));

// ✅ CRUD
router.post("/", checkPermission("notes", "Add"), catchAsync(createNote));
router.get("/", checkPermission("notes", "View"), catchAsync(getAllNotes));
router.get("/:id", checkPermission("notes", "View"), catchAsync(getNoteById));
router.put("/:id", checkPermission("notes", "Edit"), catchAsync(updateNote));
router.delete("/:id", checkPermission("notes", "Delete"), catchAsync(deleteNote));

export default router;