// src/middlewares/checkPermission.ts

import { Request, Response, NextFunction } from "express";
import { db } from "../models/db";
import { codrivers } from "../models/user/codrivers";
import { drivers } from "../models/user/drivers";
import { roles } from "../models/admin/roles";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "../Errors";
import { Permission, Role } from "../types/custom";
import { ActionName, ModuleName } from "../types/constant";


const hasPermission = (
  permissions: Permission[],
  module: ModuleName,
  action: ActionName
): boolean => {
  const modulePerm = permissions.find((p) => p.module === module);
  if (!modulePerm) return false;
  return modulePerm.actions.some((a) => a.action === action);
};

// Helper: Get user data by role
const getUserData = async (userId: number, role: Role) => {
  if (role === "driver") {
    const result = await db.select().from(drivers).where(eq(drivers.id, userId)).limit(1);
    return result[0];
  }
  if (role === "codriver") {
    const result = await db.select().from(codrivers).where(eq(codrivers.id, userId)).limit(1);
    return result[0];
  }
  return null;
};

// Helper: Get role data
const getRoleData = async (roleId: number) => {
  const result = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  return result[0];
};

export const checkPermission = (module: ModuleName, action: ActionName) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId, role } = req.user || {};

      if (!userId || !role) {
        throw new UnauthorizedError("User not authenticated");
      }

      // SuperAdmin و Organization عندهم كل الصلاحيات
      if (role === "superadmin" || role === "organization") {
        return next();
      }

      // Parent عنده صلاحيات ثابتة
      if (role === "parent") {
        const parentAllowed: Permission[] = [
          { module: "children", actions: [{ id: "1", action: "View" }] },
          { module: "trips", actions: [{ id: "2", action: "View" }] },
          { module: "notifications", actions: [{ id: "3", action: "View" }] },
        ];
        if (hasPermission(parentAllowed, module, action)) {
          return next();
        }
        throw new UnauthorizedError("You don't have permission for this action");
      }

      // Driver و CoDriver
      const userData = await getUserData(userId, role);

      if (!userData) {
        throw new UnauthorizedError("User not found");
      }

      // 1. شيك على صلاحيات اليوزر الخاصة (override)
      const userPermissions = (userData.permissions as unknown as Permission[]) || [];
      if (hasPermission(userPermissions, module, action)) {
        return next();
      }

      // 2. شيك على صلاحيات الـ Role
      if (userData.roleId) {
        const roleData = await getRoleData(userData.roleId);
        if (roleData) {
          const rolePermissions = (roleData.permissions as Permission[]) || [];
          if (hasPermission(rolePermissions, module, action)) {
            return next();
          }
        }
      }

      throw new UnauthorizedError("You don't have permission for this action");
    } catch (error) {
      next(error);
    }
  };
};