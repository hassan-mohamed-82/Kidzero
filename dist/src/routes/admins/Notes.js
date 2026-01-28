"use strict";
// src/routes/admin/noteRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Notes_1 = require("../../controllers/admin/Notes");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// ✅ Static routes first
router.get("/upcoming", (0, checkpermission_1.checkPermission)("notes", "View"), (0, catchAsync_1.catchAsync)(Notes_1.getUpcomingNotes));
// ✅ CRUD
router.post("/", (0, checkpermission_1.checkPermission)("notes", "Add"), (0, catchAsync_1.catchAsync)(Notes_1.createNote));
router.get("/", (0, checkpermission_1.checkPermission)("notes", "View"), (0, catchAsync_1.catchAsync)(Notes_1.getAllNotes));
router.get("/:id", (0, checkpermission_1.checkPermission)("notes", "View"), (0, catchAsync_1.catchAsync)(Notes_1.getNoteById));
router.put("/:id", (0, checkpermission_1.checkPermission)("notes", "Edit"), (0, catchAsync_1.catchAsync)(Notes_1.updateNote));
router.delete("/:id", (0, checkpermission_1.checkPermission)("notes", "Delete"), (0, catchAsync_1.catchAsync)(Notes_1.deleteNote));
exports.default = router;
