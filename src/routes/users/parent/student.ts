import { Router } from "express";

import {
  getMyChildren,
  getChildDetails,
} from "../../../controllers/users/parent/student"
import { authorizeRoles } from "../../../middlewares/authorized";

const router = Router();

// Routes for Parent to manage their children
router.get("/", authorizeRoles("parent"), getMyChildren);
router.get("/:childId", authorizeRoles("parent"), getChildDetails);
export default router;