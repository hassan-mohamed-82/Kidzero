"use strict";
// src/controllers/admin/adminController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfile = exports.updateProfile = exports.getProfile = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getProfile = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (id !== currentUserId) {
        throw new BadRequest_1.BadRequest("You can only access your own profile");
    }
    const admin = await db_1.db
        .select({
        id: schema_1.admins.id,
        organizationId: schema_1.admins.organizationId,
        name: schema_1.admins.name,
        email: schema_1.admins.email,
        phone: schema_1.admins.phone,
        avatar: schema_1.admins.avatar,
        type: schema_1.admins.type,
        permissions: schema_1.admins.permissions,
        status: schema_1.admins.status,
        createdAt: schema_1.admins.createdAt,
        updatedAt: schema_1.admins.updatedAt,
    })
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!admin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    (0, response_1.SuccessResponse)(res, { admin: admin[0] }, 200);
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    const { name, phone, avatar, password } = req.body;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (id !== currentUserId) {
        throw new BadRequest_1.BadRequest("You can only update your own profile");
    }
    const admin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!admin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    const updatedData = {
        name: name ?? admin[0].name,
        phone: phone ?? admin[0].phone,
        avatar: avatar ?? admin[0].avatar,
    };
    if (password) {
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        updatedData.password = hashedPassword;
    }
    await db_1.db
        .update(schema_1.admins)
        .set(updatedData)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)));
    (0, response_1.SuccessResponse)(res, { message: "Profile updated successfully" }, 200);
};
exports.updateProfile = updateProfile;
const deleteProfile = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (id !== currentUserId) {
        throw new BadRequest_1.BadRequest("You can only delete your own profile");
    }
    const admin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!admin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    await db_1.db.delete(schema_1.admins).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)));
    (0, response_1.SuccessResponse)(res, { message: "Profile deleted successfully" }, 200);
};
exports.deleteProfile = deleteProfile;
