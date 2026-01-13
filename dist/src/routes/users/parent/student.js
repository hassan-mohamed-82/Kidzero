"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_1 = require("../../../controllers/users/parent/student");
const authorized_1 = require("../../../middlewares/authorized");
const router = (0, express_1.Router)();
// Routes for Parent to manage their children
router.get("/", (0, authorized_1.authorizeRoles)("parent"), student_1.getMyChildren);
router.get("/:childId", (0, authorized_1.authorizeRoles)("parent"), student_1.getChildDetails);
exports.default = router;
