"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.changePassword = exports.getMyProfile = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const Errors_1 = require("../../Errors");
const bcrypt_1 = __importDefault(require("bcrypt"));
// ✅ Get My Profile (لكل الأنواع)
const getMyProfile = async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    let profile = null;
    if (user.role === "driver") {
        const driver = await db_1.db
            .select({
            id: schema_1.drivers.id,
            name: schema_1.drivers.name,
            phone: schema_1.drivers.phone,
            avatar: schema_1.drivers.avatar,
            licenseExpiry: schema_1.drivers.licenseExpiry,
            status: schema_1.drivers.status,
        })
            .from(schema_1.drivers)
            .where((0, drizzle_orm_1.eq)(schema_1.drivers.id, user.id))
            .limit(1);
        profile = driver[0];
    }
    else if (user.role === "codriver") {
        const codriver = await db_1.db
            .select({
            id: schema_1.codrivers.id,
            name: schema_1.codrivers.name,
            phone: schema_1.codrivers.phone,
            avatar: schema_1.codrivers.avatar,
            status: schema_1.codrivers.status,
        })
            .from(schema_1.codrivers)
            .where((0, drizzle_orm_1.eq)(schema_1.codrivers.id, user.id))
            .limit(1);
        profile = codriver[0];
    }
    else if (user.role === "parent") {
        const parent = await db_1.db
            .select({
            id: schema_1.parents.id,
            name: schema_1.parents.name,
            phone: schema_1.parents.phone,
            avatar: schema_1.parents.avatar,
            address: schema_1.parents.address,
            status: schema_1.parents.status,
        })
            .from(schema_1.parents)
            .where((0, drizzle_orm_1.eq)(schema_1.parents.id, user.id))
            .limit(1);
        const children = await db_1.db
            .select({
            id: schema_1.students.id,
            name: schema_1.students.name,
            avatar: schema_1.students.avatar,
            grade: schema_1.students.grade,
            classroom: schema_1.students.classroom,
        })
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, user.id));
        profile = { ...parent[0], children };
    }
    if (!profile) {
        throw new NotFound_1.NotFound("Profile not found");
    }
    (0, response_1.SuccessResponse)(res, { profile: { ...profile, role: user.role } }, 200);
};
exports.getMyProfile = getMyProfile;
// ✅ Change Password
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;
    if (!user) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    let currentPassword = null;
    let table = null;
    if (user.role === "driver") {
        const driver = await db_1.db
            .select({ password: schema_1.drivers.password })
            .from(schema_1.drivers)
            .where((0, drizzle_orm_1.eq)(schema_1.drivers.id, user.id))
            .limit(1);
        currentPassword = driver[0]?.password;
        table = schema_1.drivers;
    }
    else if (user.role === "codriver") {
        const codriver = await db_1.db
            .select({ password: schema_1.codrivers.password })
            .from(schema_1.codrivers)
            .where((0, drizzle_orm_1.eq)(schema_1.codrivers.id, user.id))
            .limit(1);
        currentPassword = codriver[0]?.password;
        table = schema_1.codrivers;
    }
    else if (user.role === "parent") {
        const parent = await db_1.db
            .select({ password: schema_1.parents.password })
            .from(schema_1.parents)
            .where((0, drizzle_orm_1.eq)(schema_1.parents.id, user.id))
            .limit(1);
        currentPassword = parent[0]?.password;
        table = schema_1.parents;
    }
    if (!currentPassword) {
        throw new NotFound_1.NotFound("User not found");
    }
    const isValidPassword = await bcrypt_1.default.compare(oldPassword, currentPassword);
    if (!isValidPassword) {
        throw new BadRequest_1.BadRequest("Old password is incorrect");
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await db_1.db
        .update(table)
        .set({ password: hashedPassword })
        .where((0, drizzle_orm_1.eq)(table.id, user.id));
    (0, response_1.SuccessResponse)(res, { message: "Password changed successfully" }, 200);
};
exports.changePassword = changePassword;
// ✅ Update Profile
const updateProfile = async (req, res) => {
    const { name, avatar, address } = req.body;
    const user = req.user;
    if (!user) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const updateData = {};
    if (name)
        updateData.name = name;
    if (avatar !== undefined)
        updateData.avatar = avatar;
    if (user.role === "driver") {
        await db_1.db.update(schema_1.drivers).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, user.id));
    }
    else if (user.role === "codriver") {
        await db_1.db.update(schema_1.codrivers).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.codrivers.id, user.id));
    }
    else if (user.role === "parent") {
        if (address !== undefined)
            updateData.address = address;
        await db_1.db.update(schema_1.parents).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.parents.id, user.id));
    }
    (0, response_1.SuccessResponse)(res, { message: "Profile updated successfully" }, 200);
};
exports.updateProfile = updateProfile;
