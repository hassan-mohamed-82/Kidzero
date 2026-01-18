import { Router } from "express";

import {
  getMyChildren,
  addChild,
} from "../../../controllers/users/parent/student"
import { authorizeRoles } from "../../../middlewares/authorized";

const router = Router();

// Routes for Parent to manage their children
router.get("/", authorizeRoles("parent"), getMyChildren);
router.post("/add", authorizeRoles("parent"), addChild);

export default router;