"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const schema_1 = require("../../models/schema");
const BadRequest_1 = require("../../Errors/BadRequest");
const Errors_1 = require("../../Errors");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getProfile = async (req, res) => {
    const superAdminId = req.user?.id;
    const superAdmin = await db_1.db.query.superAdmins.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.superAdmins.id, superAdminId),
        columns: {
            passwordHashed: false, // Exclude password from query
        }
    });
    if (!superAdmin) {
        throw new NotFound_1.NotFound("Super Admin not found");
    }
    return (0, response_1.SuccessResponse)(res, {
        message: "Super Admin profile fetched successfully",
        data: superAdmin,
    });
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const superAdminId = req.user?.id;
    const { name, email, password } = req.body;
    if (!password) {
        throw new BadRequest_1.BadRequest("Password is required to update profile");
    }
    const superAdmin = await db_1.db.query.superAdmins.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.superAdmins.id, superAdminId),
    });
    if (!superAdmin) {
        throw new NotFound_1.NotFound("Super Admin not found");
    }
    const match = await bcrypt_1.default.compare(password, superAdmin.passwordHashed);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid password");
    }
    else {
        const updatedSuperAdmin = await db_1.db
            .update(schema_1.superAdmins)
            .set({
            name: name || superAdmin.name,
            email: email || superAdmin.email
        })
            .where((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, superAdminId));
        return (0, response_1.SuccessResponse)(res, {
            message: "Super Admin profile updated successfully"
        });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    const superAdminId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new BadRequest_1.BadRequest("Current and new passwords are required");
    }
    const superAdmin = await db_1.db.query.superAdmins.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.superAdmins.id, superAdminId),
    });
    if (!superAdmin) {
        throw new NotFound_1.NotFound("Super Admin not found");
    }
    const match = await bcrypt_1.default.compare(currentPassword, superAdmin.passwordHashed);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid current password");
    }
    else {
        if (currentPassword === newPassword) {
            throw new BadRequest_1.BadRequest("New password must be different from current password");
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await db_1.db.update(schema_1.superAdmins)
            .set({ passwordHashed: hashedPassword })
            .where((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, superAdminId));
        return (0, response_1.SuccessResponse)(res, {
            message: "Password changed successfully"
        });
    }
};
exports.changePassword = changePassword;
