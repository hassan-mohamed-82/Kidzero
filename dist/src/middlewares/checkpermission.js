"use strict";
// src/middlewares/checkPermission.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSuperAdminPermission = exports.checkPermission = void 0;
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../Errors");
// ===================== ADMIN PERMISSIONS =====================
// التحقق من صلاحية معينة للـ Admin
const hasPermission = (permissions, module, action) => {
    const modulePermission = permissions.find((p) => p.module === module);
    if (!modulePermission)
        return false;
    if (!action) {
        return modulePermission.actions.length > 0;
    }
    return modulePermission.actions.some((a) => a.action === action);
};
// جلب الـ Permissions للـ Admin
const getAdminPermissions = async (adminId) => {
    const admin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.id, adminId))
        .limit(1);
    if (!admin[0] || !admin[0].roleId) {
        throw new Errors_1.ForbiddenError("No role assigned");
    }
    const role = await db_1.db
        .select()
        .from(schema_1.roles)
        .where((0, drizzle_orm_1.eq)(schema_1.roles.id, admin[0].roleId))
        .limit(1);
    if (!role[0]) {
        throw new Errors_1.ForbiddenError("Role not found");
    }
    return role[0].permissions;
};
// ✅ Middleware للتحقق من صلاحيات Admin/Organizer
const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Errors_1.UnauthorizedError("Authentication required");
            }
            // SuperAdmin و Organizer عندهم كل الصلاحيات
            if (user.role === "superadmin" || user.role === "organizer") {
                return next();
            }
            // للـ Admin - نتحقق من الصلاحيات
            if (user.role === "admin") {
                const permissions = await getAdminPermissions(user.id);
                if (!hasPermission(permissions, module, action)) {
                    const errorMsg = action
                        ? `You don't have permission to ${action} ${module}`
                        : `You don't have access to ${module}`;
                    throw new Errors_1.ForbiddenError(errorMsg);
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkPermission = checkPermission;
// ✅ التحقق من صلاحية معينة للـ SuperAdmin (منفصلة)
const hasSuperAdminPermission = (permissions, module, action) => {
    const modulePermission = permissions.find((p) => p.module === module);
    if (!modulePermission)
        return false;
    if (!action) {
        return modulePermission.actions.length > 0;
    }
    return modulePermission.actions.some((a) => a.action === action);
};
// جلب الـ Permissions للـ SubAdmin
const getSubAdminPermissions = async (subAdminId) => {
    const subAdmin = await db_1.db
        .select({ roleId: schema_1.superAdmins.roleId })
        .from(schema_1.superAdmins)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, subAdminId))
        .limit(1);
    if (!subAdmin[0] || !subAdmin[0].roleId) {
        throw new Errors_1.ForbiddenError("No role assigned to this SubAdmin");
    }
    const role = await db_1.db
        .select({ permissions: schema_1.superAdminRoles.permissions })
        .from(schema_1.superAdminRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, subAdmin[0].roleId))
        .limit(1);
    if (!role[0]) {
        throw new Errors_1.ForbiddenError("Role not found");
    }
    return role[0].permissions;
};
// ✅ Middleware للتحقق من صلاحيات SuperAdmin/SubAdmin
const checkSuperAdminPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Errors_1.UnauthorizedError("Authentication required");
            }
            // ✅ SuperAdmin - صلاحيات كاملة
            if (user.role === "superadmin") {
                return next();
            }
            // ✅ SubAdmin - صلاحيات من الـ Role
            if (user.role === "subadmin") {
                const permissions = await getSubAdminPermissions(user.id);
                if (!hasSuperAdminPermission(permissions, module, action)) {
                    const errorMsg = action
                        ? `You don't have permission to ${action} ${module}`
                        : `You don't have access to ${module}`;
                    throw new Errors_1.ForbiddenError(errorMsg);
                }
                return next();
            }
            throw new Errors_1.ForbiddenError("Access denied");
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkSuperAdminPermission = checkSuperAdminPermission;
