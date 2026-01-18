// src/controllers/admin/parentController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { parents, students } from "../../models/schema";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Parent
export const createParent = async (req: Request, res: Response) => {
    const { name, phone, password, avatar,email, address, nationalId } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingParent = await db
        .select()
        .from(parents)
        .where(eq(parents.phone, phone))
        .limit(1);

    if (existingParent[0]) {
        throw new BadRequest("Phone number already registered");
    }

    const parentId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl = null;
    if (avatar) {
        const result = await saveBase64Image(req, avatar, `parents/${parentId}`);
        avatarUrl = result.url;
    }

    await db.insert(parents).values({
        id: parentId,
        name,
        phone,
        email,
        password: hashedPassword,
        avatar: avatarUrl,
        address: address || null,
        nationalId: nationalId || null,
    });

    SuccessResponse(res, { message: "Parent created successfully", parentId }, 201);
};

// ✅ Get All Parents
export const getAllParents = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allParents = await db
        .select({
            id: parents.id,
            name: parents.name,
            email: parents.email,
            phone: parents.phone,
            avatar: parents.avatar,
            address: parents.address,
            nationalId: parents.nationalId,
            status: parents.status,
            createdAt: parents.createdAt,
            updatedAt: parents.updatedAt,
        })
        .from(parents);

    SuccessResponse(res, { parents: allParents }, 200);
};

// ✅ Get Parent By ID (with students)
export const getParentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const parent = await db
        .select({
            id: parents.id,
            name: parents.name,
            phone: parents.phone,
            email: parents.email,
            avatar: parents.avatar,
            address: parents.address,
            nationalId: parents.nationalId,
            status: parents.status,
            createdAt: parents.createdAt,
            updatedAt: parents.updatedAt,
        })
        .from(parents)
        .where(eq(parents.id, id))
        .limit(1);

    if (!parent[0]) {
        throw new NotFound("Parent not found");
    }

    const parentStudents = await db
        .select({
            id: students.id,
            name: students.name,
            avatar: students.avatar,
            grade: students.grade,
            classroom: students.classroom,
            status: students.status,
        })
        .from(students)
        .where(eq(students.parentId, id));

    SuccessResponse(res, { parent: { ...parent[0], students: parentStudents } }, 200);
};

// ✅ Update Parent
export const updateParent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, password, avatar, email,address, nationalId, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingParent = await db
        .select()
        .from(parents)
        .where(eq(parents.id, id))
        .limit(1);

    if (!existingParent[0]) {
        throw new NotFound("Parent not found");
    }

    if (phone && phone !== existingParent[0].phone) {
        const phoneExists = await db
            .select()
            .from(parents)
            .where(eq(parents.phone, phone))
            .limit(1);

        if (phoneExists[0]) {
            throw new BadRequest("Phone number already registered");
        }
    }

    let hashedPassword = existingParent[0].password;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    let avatarUrl = existingParent[0].avatar;
    if (avatar !== undefined) {
        if (existingParent[0].avatar) {
            await deletePhotoFromServer(existingParent[0].avatar);
        }
        if (avatar) {
            const result = await saveBase64Image(req, avatar, `parents/${id}`);
            avatarUrl = result.url;
        } else {
            avatarUrl = null;
        }
    }

    await db.update(parents).set({
        name: name ?? existingParent[0].name,
        phone: phone ?? existingParent[0].phone,
        password: hashedPassword,
        avatar: avatarUrl,
        email: email ?? existingParent[0].email,
        address: address !== undefined ? address : existingParent[0].address,
        nationalId: nationalId !== undefined ? nationalId : existingParent[0].nationalId,
        status: status ?? existingParent[0].status,
    }).where(eq(parents.id, id));

    // لو الـ status اتغير لـ inactive، حول كل الـ students لـ inactive
    if (status === "inactive") {
        await db.update(students)
            .set({ status: "inactive" })
            .where(eq(students.parentId, id));
    }

    SuccessResponse(res, { message: "Parent updated successfully" }, 200);
};


// ✅ Delete Parent
export const deleteParent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingParent = await db
        .select()
        .from(parents)
        .where(eq(parents.id, id))
        .limit(1);

    if (!existingParent[0]) {
        throw new NotFound("Parent not found");
    }

    // Check if parent has students
    const parentStudents = await db
        .select()
        .from(students)
        .where(eq(students.parentId, id))
        .limit(1);

    if (parentStudents[0]) {
        throw new BadRequest("Cannot delete parent with students. Delete students first.");
    }

    if (existingParent[0].avatar) {
        await deletePhotoFromServer(existingParent[0].avatar);
    }

    await db.delete(parents).where(eq(parents.id, id));

    SuccessResponse(res, { message: "Parent deleted successfully" }, 200);
};
