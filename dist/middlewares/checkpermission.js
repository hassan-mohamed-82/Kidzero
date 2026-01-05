// src/middleware/checkPermission.ts
import { db } from "../models/db";
import { admins, roles } from "../models/schema";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "../Errors";
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
    return role[0].permissions;
};
// ✅ Middleware واحد للتحقق من الصلاحيات
export const checkPermission = (module, action) => {
    return async (req, res, next) => {
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
        }
        catch (error) {
            next(error);
        }
    };
};
//# sourceMappingURL=checkpermission.js.map