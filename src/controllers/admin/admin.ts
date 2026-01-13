// src/controllers/admin/adminController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins, roles } from "../../models/schema";
import { eq, and, ne } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";

// ✅ Get All Admins (للـ Organization الحالية)
export const getAllAdmins = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allAdmins = await db
        .select({
            id: admins.id,
            organizationId: admins.organizationId,
            roleId: admins.roleId,
            name: admins.name,
            email: admins.email,
            phone: admins.phone,
            avatar: admins.avatar,
            type: admins.type,
            status: admins.status,
            createdAt: admins.createdAt,
            updatedAt: admins.updatedAt,
        })
        .from(admins)
        .where(eq(admins.organizationId, organizationId));

    SuccessResponse(res, { admins: allAdmins }, 200);
};

// ✅ Get Admin By ID (مع الـ Role Details)
export const getAdminById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const admin = await db
        .select({
            id: admins.id,
            organizationId: admins.organizationId,
            name: admins.name,
            email: admins.email,
            phone: admins.phone,
            avatar: admins.avatar,
            type: admins.type,
            permissions: admins.permissions,
            status: admins.status,
            createdAt: admins.createdAt,
            updatedAt: admins.updatedAt,
            role: {
                id: roles.id,
                name: roles.name,
                permissions: roles.permissions,
            },
        })
        .from(admins)
        .leftJoin(roles, eq(admins.roleId, roles.id))
        .where(and(eq(admins.id, id), eq(admins.organizationId, organizationId)))
        .limit(1);

    if (!admin[0]) {
        throw new NotFound("Admin not found");
    }

    SuccessResponse(res, { admin: admin[0] }, 200);
};


// ✅ Create Admin
export const createAdmin = async (req: Request, res: Response) => {
    const { name, email, password, phone, avatar, roleId, type } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    // تحقق من عدم وجود admin بنفس الـ email
    const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email))
        .limit(1);

    if (existingAdmin[0]) {
        throw new BadRequest("Email already exists");
    }

    // لو فيه roleId، نتحقق إنه موجود
    if (roleId) {
        const role = await db
            .select()
            .from(roles)
            .where(eq(roles.id, roleId))
            .limit(1);

        if (!role[0]) {
            throw new BadRequest("Role not found");
        }
    }

    // Hash الـ password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(admins).values({
        organizationId,
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        avatar: avatar || null,
        roleId: roleId || null,
        type: type || "admin",
    });

    SuccessResponse(res, { message: "Admin created successfully" }, 201);
};

// ✅ Update Admin
export const updateAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, phone, avatar, roleId, type, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    // تحقق من وجود الـ Admin
    const existingAdmin = await db
        .select()
        .from(admins)
        .where(and(eq(admins.id, id), eq(admins.organizationId, organizationId)))
        .limit(1);

    if (!existingAdmin[0]) {
        throw new NotFound("Admin not found");
    }

    // لو بيغير الـ email، نتحقق إنه مش موجود
    if (email && email !== existingAdmin[0].email) {
        const duplicateEmail = await db
            .select()
            .from(admins)
            .where(and(eq(admins.email, email), ne(admins.id, id)))
            .limit(1);

        if (duplicateEmail[0]) {
            throw new BadRequest("Email already exists");
        }
    }

    // لو فيه roleId جديد، نتحقق إنه موجود
    if (roleId) {
        const role = await db
            .select()
            .from(roles)
            .where(eq(roles.id, roleId))
            .limit(1);

        if (!role[0]) {
            throw new BadRequest("Role not found");
        }
    }

    // تجهيز البيانات للتحديث
    const updateData: any = {
        name: name ?? existingAdmin[0].name,
        email: email ?? existingAdmin[0].email,
        phone: phone !== undefined ? phone : existingAdmin[0].phone,
        avatar: avatar !== undefined ? avatar : existingAdmin[0].avatar,
        roleId: roleId !== undefined ? roleId : existingAdmin[0].roleId,
        type: type ?? existingAdmin[0].type,
        status: status ?? existingAdmin[0].status,
    };

    // لو فيه password جديد
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(admins).set(updateData).where(eq(admins.id, id));

    SuccessResponse(res, { message: "Admin updated successfully" }, 200);
};

// ✅ Delete Admin
export const deleteAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    // منع حذف النفس
    if (id === currentUserId) {
        throw new BadRequest("You cannot delete yourself");
    }

    const existingAdmin = await db
        .select()
        .from(admins)
        .where(and(eq(admins.id, id), eq(admins.organizationId, organizationId)))
        .limit(1);

    if (!existingAdmin[0]) {
        throw new NotFound("Admin not found");
    }

    await db.delete(admins).where(eq(admins.id, id));

    SuccessResponse(res, { message: "Admin deleted successfully" }, 200);
};




// ✅ Get Role Names Only
export const getRoleNames = async (req: Request, res: Response) => {
  const allRoles = await db
    .select({
      id: roles.id,
      name: roles.name,
    })
    .from(roles)
    .where(eq(roles.status, "active")); // الـ Active بس

  return SuccessResponse(res, { roles: allRoles }, 200);
};
