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

// ✅ Helper function لتحويل الـ permissions (معالجة Double Escape)
function parsePermissions(permissions: any): Permission[] {
  if (!permissions) return [];
  
  // لو Array جاهز
  if (Array.isArray(permissions)) return permissions;
  
  // لو String
  if (typeof permissions === "string") {
    try {
      let parsed = JSON.parse(permissions);
      
      // ✅ لو لسه String بعد الـ parse (Double Escaped)
      while (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error parsing permissions:", error);
      return [];
    }
  }
  
  return [];
}

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
    // الـ Organizer له كل الصلاحيات
    permissions = [];
  } else if (admin[0].roleId) {
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
      permissions = parsePermissions(roleData[0].permissions);
    }
  }

  // دمج صلاحيات الـ Admin الإضافية
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

  const token =
    admin[0].type === "organizer"
      ? generateOrganizerToken(tokenPayload)
      : generateAdminToken(tokenPayload);

  // 6) الرد
  return SuccessResponse(
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

// ✅ دالة دمج الصلاحيات
function mergePermissions(
  rolePermissions: Permission[],
  adminPermissions: Permission[]
): Permission[] {
  if (!Array.isArray(rolePermissions)) rolePermissions = [];
  if (!Array.isArray(adminPermissions)) adminPermissions = [];

  if (rolePermissions.length === 0) return adminPermissions;
  if (adminPermissions.length === 0) return rolePermissions;

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
    } else {
      merged.push(adminPerm);
    }
  }

  return merged;
}
