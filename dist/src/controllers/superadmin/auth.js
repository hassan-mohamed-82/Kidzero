"use strict";
// src/controllers/superadmin/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const db_1 = require("../../models/db");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../../utils/auth");
const superadmin_1 = require("../../models/superadmin/superadmin");
const schema_1 = require("../../models/schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
// ✅ Parse permissions من string لـ array
const parsePermissions = (permissions) => {
    if (!permissions)
        return [];
    if (Array.isArray(permissions))
        return permissions;
    if (typeof permissions === "string") {
        try {
            let parsed = JSON.parse(permissions);
            while (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
            }
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
async function login(req, res) {
    const { email, password } = req.body;
    // جلب الـ Super Admin مع الـ Role
    const superAdmin = await db_1.db
        .select({
        id: superadmin_1.superAdmins.id,
        name: superadmin_1.superAdmins.name,
        email: superadmin_1.superAdmins.email,
        role: superadmin_1.superAdmins.role,
        passwordHashed: superadmin_1.superAdmins.passwordHashed,
        roleId: superadmin_1.superAdmins.roleId,
        status: superadmin_1.superAdmins.status,
        // Role
        roleName: schema_1.superAdminRoles.name,
        rolePermissions: schema_1.superAdminRoles.permissions,
        roleStatus: schema_1.superAdminRoles.status,
    })
        .from(superadmin_1.superAdmins)
        .leftJoin(schema_1.superAdminRoles, (0, drizzle_orm_1.eq)(superadmin_1.superAdmins.roleId, schema_1.superAdminRoles.id))
        .where((0, drizzle_orm_1.eq)(superadmin_1.superAdmins.email, email))
        .limit(1);
    if (!superAdmin[0]) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const admin = superAdmin[0];
    // التحقق من الباسورد
    const match = await bcrypt_1.default.compare(password, admin.passwordHashed);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    // التحقق من حالة الحساب
    if (admin.status === "inactive") {
        throw new Errors_1.UnauthorizedError("Account is inactive");
    }
    // التحقق من حالة الـ Role
    if (admin.roleId && admin.roleStatus === "inactive") {
        throw new Errors_1.UnauthorizedError("Your role is inactive");
    }
    // ✅ Parse الـ permissions
    const permissions = parsePermissions(admin.rolePermissions);
    // توليد التوكن
    const token = admin.role === "superadmin"
        ? (0, auth_1.generateSuperAdminToken)({
            id: admin.id,
            email: admin.email,
            name: admin.name,
        })
        : (0, auth_1.generateSubAdminToken)({
            id: admin.id,
            email: admin.email,
            name: admin.name,
        });
    (0, response_1.SuccessResponse)(res, {
        message: "Login successful",
        token,
        superAdmin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            roleDetails: admin.roleId
                ? {
                    id: admin.roleId,
                    name: admin.roleName,
                    permissions, // ✅ هترجع كـ array
                }
                : null,
        },
    }, 200);
}
