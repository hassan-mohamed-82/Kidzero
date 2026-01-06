"use strict";
// src/middleware/checkPermission.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../Errors");
// التحقق من صلاحية معينة
const hasPermission = (permissions, module, action) => {
    const modulePermission = permissions.find((p) => p.module === module);
    if (!modulePermission)
        return false;
    // لو مفيش action محدد، نتحقق من أي وصول للـ module
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
// ✅ Middleware واحد للتحقق من الصلاحيات
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
