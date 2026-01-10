"use strict";
// src/controllers/mobile/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.changePassword = exports.getMyProfile = exports.driverAppLogin = exports.parentLogin = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const Errors_1 = require("../../Errors");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../utils/auth");
// ✅ Parent Login (Parent App)
const parentLogin = async (req, res) => {
    const { phone, password } = req.body;
    const parent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.phone, phone))
        .limit(1);
    if (!parent[0]) {
        throw new Errors_1.UnauthorizedError("Invalid phone number or password");
    }
    if (parent[0].status === "inactive") {
        throw new Errors_1.UnauthorizedError("Your account is inactive. Please contact admin.");
    }
    const isValidPassword = await bcrypt_1.default.compare(password, parent[0].password);
    if (!isValidPassword) {
        throw new Errors_1.UnauthorizedError("Invalid phone number or password");
    }
    // جلب الأبناء
    const children = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parent[0].id));
    const token = (0, auth_1.generateParentToken)({
        id: parent[0].id,
        name: parent[0].name,
        organizationId: parent[0].organizationId,
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Login successful",
        token,
        user: {
            id: parent[0].id,
            name: parent[0].name,
            phone: parent[0].phone,
            avatar: parent[0].avatar,
            address: parent[0].address,
            role: "parent",
            children,
        },
    }, 200);
};
exports.parentLogin = parentLogin;
// ✅ Driver/CoDriver Login (Driver App)
const driverAppLogin = async (req, res) => {
    const { phone, password } = req.body;
    // 1. البحث في جدول الـ Drivers
    const driver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.eq)(schema_1.drivers.phone, phone))
        .limit(1);
    if (driver[0]) {
        if (driver[0].status === "inactive") {
            throw new Errors_1.UnauthorizedError("Your account is inactive. Please contact admin.");
        }
        const isValidPassword = await bcrypt_1.default.compare(password, driver[0].password);
        if (!isValidPassword) {
            throw new Errors_1.UnauthorizedError("Invalid phone number or password");
        }
        const token = (0, auth_1.generateDriverToken)({
            id: driver[0].id,
            name: driver[0].name,
            organizationId: driver[0].organizationId,
        });
        return (0, response_1.SuccessResponse)(res, {
            message: "Login successful",
            token,
            user: {
                id: driver[0].id,
                name: driver[0].name,
                phone: driver[0].phone,
                avatar: driver[0].avatar,
                role: "driver",
            },
        }, 200);
    }
    // 2. البحث في جدول الـ CoDrivers
    const codriver = await db_1.db
        .select()
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.eq)(schema_1.codrivers.phone, phone))
        .limit(1);
    if (codriver[0]) {
        if (codriver[0].status === "inactive") {
            throw new Errors_1.UnauthorizedError("Your account is inactive. Please contact admin.");
        }
        const isValidPassword = await bcrypt_1.default.compare(password, codriver[0].password);
        if (!isValidPassword) {
            throw new Errors_1.UnauthorizedError("Invalid phone number or password");
        }
        const token = (0, auth_1.generateCoDriverToken)({
            id: codriver[0].id,
            name: codriver[0].name,
            organizationId: codriver[0].organizationId,
        });
        return (0, response_1.SuccessResponse)(res, {
            message: "Login successful",
            token,
            user: {
                id: codriver[0].id,
                name: codriver[0].name,
                phone: codriver[0].phone,
                avatar: codriver[0].avatar,
                role: "codriver",
            },
        }, 200);
    }
    throw new Errors_1.UnauthorizedError("Invalid phone number or password");
};
exports.driverAppLogin = driverAppLogin;
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
