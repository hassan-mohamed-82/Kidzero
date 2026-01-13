"use strict";
// src/controllers/mobile/parentController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildDetails = exports.getMyChildren = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const Errors_1 = require("../../../Errors");
// ===================== CHILDREN =====================
// ✅ Get My Children
const getMyChildren = async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const children = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        status: schema_1.students.status,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    (0, response_1.SuccessResponse)(res, { children }, 200);
};
exports.getMyChildren = getMyChildren;
// ✅ Get Child Details
const getChildDetails = async (req, res) => {
    const { childId } = req.params;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const child = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        status: schema_1.students.status,
        createdAt: schema_1.students.createdAt,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, childId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!child[0]) {
        throw new NotFound_1.NotFound("Child not found");
    }
    (0, response_1.SuccessResponse)(res, { child: child[0] }, 200);
};
exports.getChildDetails = getChildDetails;
