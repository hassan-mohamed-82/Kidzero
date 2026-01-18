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
const Errors_1 = require("../../Errors");
const deleteImage_1 = require("../../utils/deleteImage");
const handleImages_1 = require("../../utils/handleImages");
const getProfile = async (req, res) => {
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!currentUserId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
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
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, currentUserId), // ✅ استخدم currentUserId مباشرة
    (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!admin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    return (0, response_1.SuccessResponse)(res, { admin: admin[0] }, 200);
};
exports.getProfile = getProfile;
// ✅ Update Profile
const updateProfile = async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const currentUserId = req.user?.id;
        const { name, phone, avatar, password } = req.body;
        if (!organizationId) {
            throw new BadRequest_1.BadRequest("Organization ID is required");
        }
        if (!currentUserId) {
            throw new Errors_1.UnauthorizedError("Not authenticated");
        }
        const admin = await db_1.db
            .select()
            .from(schema_1.admins)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, currentUserId), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
            .limit(1);
        if (!admin[0]) {
            throw new NotFound_1.NotFound("Admin not found");
        }
        // Process avatar and password in parallel for better performance
        const [avatarUrl, hashedPassword] = await Promise.all([
            // Handle avatar
            (async () => {
                if (avatar === undefined) {
                    return admin[0].avatar;
                }
                if (avatar === null || avatar === "") {
                    if (admin[0].avatar) {
                        await (0, deleteImage_1.deletePhotoFromServer)(admin[0].avatar);
                    }
                    return null;
                }
                if (avatar.startsWith("data:image")) {
                    if (admin[0].avatar) {
                        await (0, deleteImage_1.deletePhotoFromServer)(admin[0].avatar);
                    }
                    const savedImage = await (0, handleImages_1.saveBase64Image)(req, avatar, "avatars");
                    return savedImage.url;
                }
                return admin[0].avatar; // Keep existing if URL string
            })(),
            // Handle password
            password ? bcrypt_1.default.hash(password, 10) : Promise.resolve(null),
        ]);
        await db_1.db
            .update(schema_1.admins)
            .set({
            name: name ?? admin[0].name,
            phone: phone ?? admin[0].phone,
            avatar: avatarUrl,
            ...(hashedPassword && { password: hashedPassword }),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, currentUserId), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)));
        return (0, response_1.SuccessResponse)(res, { message: "Profile updated successfully" }, 200);
    }
    catch (error) {
        if (error instanceof BadRequest_1.BadRequest || error instanceof Errors_1.UnauthorizedError || error instanceof NotFound_1.NotFound) {
            throw error;
        }
        console.error("Update profile error:", error);
        throw new BadRequest_1.BadRequest("Failed to update profile");
    }
};
exports.updateProfile = updateProfile;
// ✅ Delete Profile
const deleteProfile = async (req, res) => {
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!currentUserId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const admin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, currentUserId), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!admin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    // حذف الصورة لو موجودة
    if (admin[0].avatar) {
        await (0, deleteImage_1.deletePhotoFromServer)(admin[0].avatar);
    }
    await db_1.db.delete(schema_1.admins).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, currentUserId), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)));
    return (0, response_1.SuccessResponse)(res, { message: "Profile deleted successfully" }, 200);
};
exports.deleteProfile = deleteProfile;
