"use strict";
// src/controllers/auth/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../utils/auth");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
// Helper function لتحويل الـ permissions
function parsePermissions(permissions) {
    if (!permissions)
        return [];
    if (typeof permissions === "string") {
        try {
            return JSON.parse(permissions);
        }
        catch {
            return [];
        }
    }
    if (Array.isArray(permissions))
        return permissions;
    return [];
}
async function login(req, res) {
    const { email, password } = req.body;
    // 1) جلب الأدمن بالإيميل
    const admin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.email, email))
        .limit(1);
    if (!admin[0]) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    // 2) التحقق من الباسورد
    const match = await bcrypt_1.default.compare(password, admin[0].password);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    // 3) التحقق من حالة الحساب
    if (admin[0].status !== "active") {
        throw new Errors_1.UnauthorizedError("Your account is inactive");
    }
    // 4) جلب الـ Role والـ Permissions
    let role = null;
    let permissions = [];
    if (admin[0].type === "organizer") {
        permissions = [];
    }
    else if (admin[0].roleId) {
        const roleData = await db_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, admin[0].roleId))
            .limit(1);
        if (roleData[0]) {
            role = {
                id: roleData[0].id,
                name: roleData[0].name,
            };
            permissions = parsePermissions(roleData[0].permissions);
        }
    }
    // دمج صلاحيات الـ Admin
    const adminPermissions = parsePermissions(admin[0].permissions);
    if (adminPermissions.length > 0) {
        permissions = mergePermissions(permissions, adminPermissions);
    }
    // 5) إنشاء التوكن
    const tokenPayload = {
        id: admin[0].id,
        name: admin[0].name,
        organizationId: admin[0].organizationId,
    };
    const token = admin[0].type === "organizer"
        ? (0, auth_1.generateOrganizerToken)(tokenPayload)
        : (0, auth_1.generateAdminToken)(tokenPayload);
    // 6) الرد
    (0, response_1.SuccessResponse)(res, {
        message: "Login successful",
        token,
        user: {
            id: admin[0].id,
            name: admin[0].name,
            email: admin[0].email,
            phone: admin[0].phone,
            avatar: admin[0].avatar,
            type: admin[0].type,
            organizationId: admin[0].organizationId,
            role,
            permissions,
        },
    }, 200);
}
// دالة دمج الصلاحيات
function mergePermissions(rolePermissions, adminPermissions) {
    if (!Array.isArray(rolePermissions))
        rolePermissions = [];
    if (!Array.isArray(adminPermissions))
        adminPermissions = [];
    if (rolePermissions.length === 0)
        return adminPermissions;
    if (adminPermissions.length === 0)
        return rolePermissions;
    const merged = [...rolePermissions];
    for (const adminPerm of adminPermissions) {
        if (!adminPerm?.module || !Array.isArray(adminPerm?.actions)) {
            continue;
        }
        const existingIndex = merged.findIndex((p) => p?.module === adminPerm.module);
        if (existingIndex >= 0 && Array.isArray(merged[existingIndex]?.actions)) {
            for (const action of adminPerm.actions) {
                if (!merged[existingIndex].actions.some((a) => a?.action === action?.action)) {
                    merged[existingIndex].actions.push(action);
                }
            }
        }
        else {
            merged.push(adminPerm);
        }
    }
    return merged;
}
