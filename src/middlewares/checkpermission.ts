// src/middlewares/checkPermission.ts

import { Request, Response, NextFunction } from "express";
import { ModuleName, ActionName } from "../types/constant";
import { Permission } from "../types/custom";

import { db } from "../models/db";
import { admins, roles, superAdminRoles, superAdmins } from "../models/schema";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "../Errors";

// ===================== ADMIN PERMISSIONS =====================

// التحقق من صلاحية معينة للـ Admin
const hasPermission = (
    permissions: Permission[],
    module: ModuleName,
    action?: ActionName
): boolean => {
    const modulePermission = permissions.find((p) => p.module === module);
    if (!modulePermission) return false;

    if (!action) {
        return modulePermission.actions.length > 0;
    }

    return modulePermission.actions.some((a) => a.action === action);
};

// جلب الـ Permissions للـ Admin
const getAdminPermissions = async (adminId: string): Promise<Permission[]> => {
    const admin = await db
        .select()
        .from(admins)
        .where(eq(admins.id, adminId))
        .limit(1);

    if (!admin[0] || !admin[0].roleId) {
        throw new ForbiddenError("No role assigned");
    }

    const role = await db
        .select()
        .from(roles)
        .where(eq(roles.id, admin[0].roleId))
        .limit(1);

    if (!role[0]) {
        throw new ForbiddenError("Role not found");
    }

    return role[0].permissions as Permission[];
};

// ✅ Middleware للتحقق من صلاحيات Admin/Organizer
export const checkPermission = (module: ModuleName, action?: ActionName) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) {
                throw new UnauthorizedError("Authentication required");
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
                    throw new ForbiddenError(errorMsg);
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// ===================== SUPER ADMIN PERMISSIONS =====================

type SuperAdminPermission = {
    module: string;
    actions: { id?: string; action: string }[];
};

// ✅ التحقق من صلاحية معينة للـ SuperAdmin (منفصلة)
const hasSuperAdminPermission = (
    permissions: SuperAdminPermission[],
    module: string,
    action?: string
): boolean => {
    const modulePermission = permissions.find((p) => p.module === module);
    if (!modulePermission) return false;

    if (!action) {
        return modulePermission.actions.length > 0;
    }

    return modulePermission.actions.some((a) => a.action === action);
};

// جلب الـ Permissions للـ SubAdmin
const getSubAdminPermissions = async (subAdminId: string): Promise<SuperAdminPermission[]> => {
    const subAdmin = await db
        .select({ roleId: superAdmins.roleId })
        .from(superAdmins)
        .where(eq(superAdmins.id, subAdminId))
        .limit(1);

    if (!subAdmin[0] || !subAdmin[0].roleId) {
        throw new ForbiddenError("No role assigned to this SubAdmin");
    }

    const role = await db
        .select({ permissions: superAdminRoles.permissions })
        .from(superAdminRoles)
        .where(eq(superAdminRoles.id, subAdmin[0].roleId))
        .limit(1);

    if (!role[0]) {
        throw new ForbiddenError("Role not found");
    }

    return role[0].permissions as SuperAdminPermission[];
};

// ✅ Middleware للتحقق من صلاحيات SuperAdmin/SubAdmin
export const checkSuperAdminPermission = (module: string, action?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) {
                throw new UnauthorizedError("Authentication required");
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
                    throw new ForbiddenError(errorMsg);
                }

                return next();
            }

            throw new ForbiddenError("Access denied");

        } catch (error) {
            next(error);
        }
    };
};
