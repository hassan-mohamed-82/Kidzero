// src/controllers/superadmin/subAdminController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { superAdmins, superAdminRoles } from "../../models/schema";
import { eq, and, ne } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";

// Helper لـ Parse الـ Permissions
const parsePermissions = (permissions: any) => {
  if (typeof permissions === "string") {
    try {
      return JSON.parse(permissions);
    } catch {
      return [];
    }
  }
  return permissions || [];
};

// ✅ Get All SubAdmins
export const getAllSubAdmins = async (req: Request, res: Response) => {
  const allSubAdmins = await db
    .select({
      id: superAdmins.id,
      name: superAdmins.name,
      email: superAdmins.email,
      role: superAdmins.role,
      roleId: superAdmins.roleId,
      status: superAdmins.status,
      createdAt: superAdmins.createdAt,
      updatedAt: superAdmins.updatedAt,
      roleDetails: {
        id: superAdminRoles.id,
        name: superAdminRoles.name,
        permissions: superAdminRoles.permissions,
      },
    })
    .from(superAdmins)
    .leftJoin(superAdminRoles, eq(superAdmins.roleId, superAdminRoles.id))
    .where(eq(superAdmins.role, "subadmin"));

  // Parse permissions
  const subAdminsWithParsedPermissions = allSubAdmins.map((admin) => ({
    ...admin,
    roleDetails: admin.roleDetails
      ? {
          ...admin.roleDetails,
          permissions: parsePermissions(admin.roleDetails.permissions),
        }
      : null,
  }));

  SuccessResponse(res, { subAdmins: subAdminsWithParsedPermissions }, 200);
};

// ✅ Get SubAdmin By ID
export const getSubAdminById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const subAdmin = await db
    .select({
      id: superAdmins.id,
      name: superAdmins.name,
      email: superAdmins.email,
      role: superAdmins.role,
      roleId: superAdmins.roleId,
      status: superAdmins.status,
      createdAt: superAdmins.createdAt,
      updatedAt: superAdmins.updatedAt,
      roleDetails: {
        id: superAdminRoles.id,
        name: superAdminRoles.name,
        permissions: superAdminRoles.permissions,
      },
    })
    .from(superAdmins)
    .leftJoin(superAdminRoles, eq(superAdmins.roleId, superAdminRoles.id))
    .where(and(eq(superAdmins.id, id), eq(superAdmins.role, "subadmin")))
    .limit(1);

  if (!subAdmin[0]) {
    throw new NotFound("SubAdmin not found");
  }

  // Parse permissions
  const subAdminWithParsedPermissions = {
    ...subAdmin[0],
    roleDetails: subAdmin[0].roleDetails
      ? {
          ...subAdmin[0].roleDetails,
          permissions: parsePermissions(subAdmin[0].roleDetails.permissions),
        }
      : null,
  };

  SuccessResponse(res, { subAdmin: subAdminWithParsedPermissions }, 200);
};

// ✅ Create SubAdmin
export const createSubAdmin = async (req: Request, res: Response) => {
  const { name, email, password, roleId } = req.body;

  if (!name || !email || !password) {
    throw new BadRequest("Name, email and password are required");
  }

  // تحقق من عدم وجود email مكرر
  const existingAdmin = await db
    .select()
    .from(superAdmins)
    .where(eq(superAdmins.email, email))
    .limit(1);

  if (existingAdmin[0]) {
    throw new BadRequest("Email already exists");
  }

  // لو فيه roleId، نتحقق إنه موجود
  if (roleId) {
    const role = await db
      .select()
      .from(superAdminRoles)
      .where(eq(superAdminRoles.id, roleId))
      .limit(1);

    if (!role[0]) {
      throw new BadRequest("Role not found");
    }
  }

  // Hash الـ password
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(superAdmins).values({
    name,
    email,
    passwordHashed: hashedPassword,
    role: "subadmin",
    roleId: roleId || null,
    status: "active",
  });

  SuccessResponse(res, { message: "SubAdmin created successfully" }, 201);
};

// ✅ Update SubAdmin
export const updateSubAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password, roleId, status } = req.body;

  // تحقق من وجود الـ SubAdmin
  const existingAdmin = await db
    .select()
    .from(superAdmins)
    .where(and(eq(superAdmins.id, id), eq(superAdmins.role, "subadmin")))
    .limit(1);

  if (!existingAdmin[0]) {
    throw new NotFound("SubAdmin not found");
  }

  // لو بيغير الـ email، نتحقق إنه مش موجود
  if (email && email !== existingAdmin[0].email) {
    const duplicateEmail = await db
      .select()
      .from(superAdmins)
      .where(and(eq(superAdmins.email, email), ne(superAdmins.id, id)))
      .limit(1);

    if (duplicateEmail[0]) {
      throw new BadRequest("Email already exists");
    }
  }

  // لو فيه roleId جديد، نتحقق إنه موجود
  if (roleId) {
    const role = await db
      .select()
      .from(superAdminRoles)
      .where(eq(superAdminRoles.id, roleId))
      .limit(1);

    if (!role[0]) {
      throw new BadRequest("Role not found");
    }
  }

  // تجهيز البيانات للتحديث
  const updateData: any = {
    name: name ?? existingAdmin[0].name,
    email: email ?? existingAdmin[0].email,
    roleId: roleId !== undefined ? roleId : existingAdmin[0].roleId,
    status: status ?? existingAdmin[0].status,
  };

  // لو فيه password جديد
  if (password) {
    updateData.passwordHashed = await bcrypt.hash(password, 10);
  }

  await db.update(superAdmins).set(updateData).where(eq(superAdmins.id, id));

  SuccessResponse(res, { message: "SubAdmin updated successfully" }, 200);
};

// ✅ Delete SubAdmin
export const deleteSubAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;

  // منع حذف النفس
  if (id === currentUserId) {
    throw new BadRequest("You cannot delete yourself");
  }

  const existingAdmin = await db
    .select()
    .from(superAdmins)
    .where(and(eq(superAdmins.id, id), eq(superAdmins.role, "subadmin")))
    .limit(1);

  if (!existingAdmin[0]) {
    throw new NotFound("SubAdmin not found");
  }

  await db.delete(superAdmins).where(eq(superAdmins.id, id));

  SuccessResponse(res, { message: "SubAdmin deleted successfully" }, 200);
};

// ✅ Toggle SubAdmin Status
export const toggleSubAdminStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;

  // منع تغيير حالة النفس
  if (id === currentUserId) {
    throw new BadRequest("You cannot change your own status");
  }

  const existingAdmin = await db
    .select()
    .from(superAdmins)
    .where(and(eq(superAdmins.id, id), eq(superAdmins.role, "subadmin")))
    .limit(1);

  if (!existingAdmin[0]) {
    throw new NotFound("SubAdmin not found");
  }

  const newStatus = existingAdmin[0].status === "active" ? "inactive" : "active";

  await db
    .update(superAdmins)
    .set({ status: newStatus })
    .where(eq(superAdmins.id, id));

  SuccessResponse(res, { message: `SubAdmin ${newStatus}` }, 200);
};