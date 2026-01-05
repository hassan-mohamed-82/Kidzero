// src/controllers/auth/authController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins, roles } from "../../models/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateOrganizerToken, generateAdminToken } from "../../utils/auth";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { Permission } from "../../types/custom";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  // 1) جلب الأدمن بالإيميل
  const admin = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (!admin[0]) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 2) التحقق من الباسورد
  const match = await bcrypt.compare(password, admin[0].password);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 3) التحقق من حالة الحساب
  if (admin[0].status !== "active") {
    throw new UnauthorizedError("Your account is inactive");
  }

  // 4) جلب الـ Role والـ Permissions
  let role = null;
  let permissions: Permission[] = [];

  if (admin[0].type === "organizer") {
    // Organizer عنده كل الصلاحيات
    permissions = []; // أو ممكن ترجع كل الصلاحيات
  } else if (admin[0].roleId) {
    // Admin - جلب الـ Role
    const roleData = await db
      .select()
      .from(roles)
      .where(eq(roles.id, admin[0].roleId))
      .limit(1);

    if (roleData[0]) {
      role = {
        id: roleData[0].id,
        name: roleData[0].name,
      };
      permissions = (roleData[0].permissions as Permission[]) || [];
    }
  }

  // دمج صلاحيات الـ Admin الخاصة (override) مع صلاحيات الـ Role
  const adminPermissions = (admin[0].permissions as Permission[]) || [];
  if (adminPermissions.length > 0) {
    permissions = mergePermissions(permissions, adminPermissions);
  }

  // 5) إنشاء التوكن
  const tokenPayload = {
    id: admin[0].id,
    name: admin[0].name,
    organizationId: admin[0].organizationId,
  };

  const token =
    admin[0].type === "organizer"
      ? generateOrganizerToken(tokenPayload)
      : generateAdminToken(tokenPayload);

  // 6) الرد
  SuccessResponse(
    res,
    {
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
    },
    200
  );
}

// دالة دمج الصلاحيات
function mergePermissions(
  rolePermissions: Permission[],
  adminPermissions: Permission[]
): Permission[] {
  const merged = [...rolePermissions];

  for (const adminPerm of adminPermissions) {
    const existingIndex = merged.findIndex((p) => p.module === adminPerm.module);

    if (existingIndex >= 0) {
      // دمج الـ actions
      const existingActions = merged[existingIndex].actions;
      for (const action of adminPerm.actions) {
        if (!existingActions.some((a) => a.action === action.action)) {
          existingActions.push(action);
        }
      }
    } else {
      // إضافة module جديد
      merged.push(adminPerm);
    }
  }

  return merged;
}
