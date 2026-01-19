// src/controllers/superadmin/authController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { eq } from "drizzle-orm";
import { generateSuperAdminToken, generateSubAdminToken } from "../../utils/auth";
import { superAdmins } from "../../models/superadmin/superadmin";
import { superAdminRoles } from "../../models/schema";
import bcrypt from "bcrypt";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  // جلب الـ Super Admin مع الـ Role
  const superAdmin = await db
    .select({
      id: superAdmins.id,
      name: superAdmins.name,
      email: superAdmins.email,
      role: superAdmins.role,
      passwordHashed: superAdmins.passwordHashed,
      roleId: superAdmins.roleId,
      status: superAdmins.status,
      // Role
      roleName: superAdminRoles.name,
      rolePermissions: superAdminRoles.permissions,
      roleStatus: superAdminRoles.status,
    })
    .from(superAdmins)
    .leftJoin(superAdminRoles, eq(superAdmins.roleId, superAdminRoles.id))
    .where(eq(superAdmins.email, email))
    .limit(1);

  if (!superAdmin[0]) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const admin = superAdmin[0];

  // التحقق من الباسورد
  const match = await bcrypt.compare(password, admin.passwordHashed);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // التحقق من حالة الحساب
  if (admin.status === "inactive") {
    throw new UnauthorizedError("Account is inactive");
  }

  // التحقق من حالة الـ Role
  if (admin.roleId && admin.roleStatus === "inactive") {
    throw new UnauthorizedError("Your role is inactive");
  }

  // توليد التوكن بناءً على نوع المستخدم
  const token =
    admin.role === "superadmin"
      ? generateSuperAdminToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
      })
      : generateSubAdminToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
      });

  SuccessResponse(
    res,
    {
      message: "Login successful",
      token,
      superAdmin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        roleId: admin.roleId
          ? {
            id: admin.roleId,
            name: admin.roleName,
            permissions: admin.rolePermissions || [],
          }
          : null,
      },
    },
    200
  );
}
