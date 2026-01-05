// src/middlewares/checkPermission.ts
import { db } from "../models/db";
import { organizationAdmins } from "../models/schema";
import { roles } from "../models/schema";
import { and, eq } from "drizzle-orm";
import { UnauthorizedError } from "../Errors";
const hasPermission = (permissions, module, action) => {
    const modulePerm = permissions.find((p) => p.module === module);
    if (!modulePerm)
        return false;
    return modulePerm.actions.some((a) => a.action === action);
};
export const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const { id, role, organizationId } = req.user || {};
            if (!id || !role || !organizationId) {
                throw new UnauthorizedError("Not authenticated");
            }
            // Organizer عنده كل الصلاحيات
            if (role === "organizer") {
                return next();
            }
            // Admin - شيك على الصلاحيات
            if (role === "admin") {
                const orgAdmin = await db
                    .select()
                    .from(organizationAdmins)
                    .where(and(eq(organizationAdmins.adminId, id), eq(organizationAdmins.organizationId, organizationId)))
                    .limit(1);
                if (!orgAdmin[0]) {
                    throw new UnauthorizedError("Admin not found");
                }
                // 1. شيك صلاحيات الـ Admin الخاصة
                const adminPermissions = orgAdmin[0].permissions || [];
                if (hasPermission(adminPermissions, module, action)) {
                    return next();
                }
                // 2. شيك صلاحيات الـ Role
                if (orgAdmin[0].roleId) {
                    const roleData = await db
                        .select()
                        .from(roles)
                        .where(eq(roles.id, orgAdmin[0].roleId)) // roleId بقى string UUID
                        .limit(1);
                    if (roleData[0]) {
                        const rolePermissions = roleData[0].permissions || [];
                        if (hasPermission(rolePermissions, module, action)) {
                            return next();
                        }
                    }
                }
            }
            throw new UnauthorizedError("You don't have permission");
        }
        catch (error) {
            next(error);
        }
    };
};
//# sourceMappingURL=checkpermission.js.map