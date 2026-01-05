// src/middlewares/checkPermission.ts

import { Request, Response, NextFunction } from "express";
import { db } from "../models/db";
import { admins, roles } from "../models/schema";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "../Errors";
import { Permission } from "../types/custom";
import { ModuleName, ActionName } from "../types/constant";

const hasPermission = (
  permissions: Permission[],
  module: ModuleName,
  action: ActionName
): boolean => {
  const modulePerm = permissions.find((p) => p.module === module);
  if (!modulePerm) return false;
  return modulePerm.actions.some((a) => a.action === action);
};

export const checkPermission = (module: ModuleName, action: ActionName) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role, organizationId } = req.user || {};

      if (!id || !role) {
        throw new UnauthorizedError("Not authenticated");
      }

      // SuperAdmin عنده كل الصلاحيات
      if (role === "superadmin") {
        return next();
      }

      // Organizer عنده كل الصلاحيات في الـ Organization بتاعته
      if (role === "organizer") {
        return next();
      }

      // Admin - شيك على الصلاحيات
      if (role === "admin") {
        const admin = await db
          .select()
          .from(admins)
          .where(eq(admins.id, id))
          .limit(1);

        if (!admin[0]) {
          throw new UnauthorizedError("Admin not found");
        }

        // 1. شيك صلاحيات الـ Admin الخاصة (override)
        const adminPermissions = (admin[0].permissions as Permission[]) || [];
        if (hasPermission(adminPermissions, module, action)) {
          return next();
        }

        // 2. شيك صلاحيات الـ Role
        if (admin[0].roleId) {
          const roleData = await db
            .select()
            .from(roles)
            .where(eq(roles.id, admin[0].roleId))
            .limit(1);

          if (roleData[0]) {
            const rolePermissions = (roleData[0].permissions as Permission[]) || [];
            if (hasPermission(rolePermissions, module, action)) {
              return next();
            }
          }
        }
      }

      throw new UnauthorizedError("You don't have permission");
    } catch (error) {
      next(error);
    }
  };
};
