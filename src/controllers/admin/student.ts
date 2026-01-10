// src/controllers/admin/studentController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { students, parents } from "../../models/schema";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { checkStudentLimit } from "../../utils/helperfunction";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Student
export const createStudent = async (req: Request, res: Response) => {
    const { parentId, name, avatar, grade, classroom } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

   // await checkStudentLimit(organizationId);

    const parent = await db
        .select()
        .from(parents)
        .where(and(eq(parents.id, parentId), eq(parents.organizationId, organizationId)))
        .limit(1);

    if (!parent[0]) {
        throw new NotFound("Parent not found");
    }

    const studentId = uuidv4();

    let avatarUrl = null;
    if (avatar) {
        const result = await saveBase64Image(req, avatar, `students/${studentId}`);
        avatarUrl = result.url;
    }

    await db.insert(students).values({
        id: studentId,
        organizationId,
        parentId,
        name,
        avatar: avatarUrl,
        grade: grade || null,
        classroom: classroom || null,
    });

    SuccessResponse(res, { message: "Student created successfully", studentId }, 201);
};

// ✅ Get All Students
export const getAllStudents = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allStudents = await db
        .select({
            id: students.id,
            name: students.name,
            avatar: students.avatar,
            grade: students.grade,
            classroom: students.classroom,
            status: students.status,
            createdAt: students.createdAt,
            updatedAt: students.updatedAt,
            parent: {
                id: parents.id,
                name: parents.name,
                phone: parents.phone,
            },
        })
        .from(students)
        .leftJoin(parents, eq(students.parentId, parents.id))
        .where(eq(students.organizationId, organizationId));

    SuccessResponse(res, { students: allStudents }, 200);
};

// ✅ Get Student By ID
export const getStudentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const student = await db
        .select({
            id: students.id,
            name: students.name,
            avatar: students.avatar,
            grade: students.grade,
            classroom: students.classroom,
            status: students.status,
            createdAt: students.createdAt,
            updatedAt: students.updatedAt,
            parent: {
                id: parents.id,
                name: parents.name,
                phone: parents.phone,
                address: parents.address,
            },
        })
        .from(students)
        .leftJoin(parents, eq(students.parentId, parents.id))
        .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
        .limit(1);

    if (!student[0]) {
        throw new NotFound("Student not found");
    }

    SuccessResponse(res, { student: student[0] }, 200);
};

// ✅ Update Student
export const updateStudent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { parentId, name, avatar, grade, classroom, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingStudent = await db
        .select()
        .from(students)
        .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
        .limit(1);

    if (!existingStudent[0]) {
        throw new NotFound("Student not found");
    }

    if (parentId && parentId !== existingStudent[0].parentId) {
        const parent = await db
            .select()
            .from(parents)
            .where(and(eq(parents.id, parentId), eq(parents.organizationId, organizationId)))
            .limit(1);

        if (!parent[0]) {
            throw new NotFound("Parent not found");
        }
    }

    let avatarUrl = existingStudent[0].avatar;
    if (avatar !== undefined) {
        if (existingStudent[0].avatar) {
            await deletePhotoFromServer(existingStudent[0].avatar);
        }
        if (avatar) {
            const result = await saveBase64Image(req, avatar, `students/${id}`);
            avatarUrl = result.url;
        } else {
            avatarUrl = null;
        }
    }

    await db.update(students).set({
        parentId: parentId ?? existingStudent[0].parentId,
        name: name ?? existingStudent[0].name,
        avatar: avatarUrl,
        grade: grade !== undefined ? grade : existingStudent[0].grade,
        classroom: classroom !== undefined ? classroom : existingStudent[0].classroom,
        status: status ?? existingStudent[0].status,
    }).where(eq(students.id, id));

    SuccessResponse(res, { message: "Student updated successfully" }, 200);
};

// ✅ Delete Student
export const deleteStudent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingStudent = await db
        .select()
        .from(students)
        .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
        .limit(1);

    if (!existingStudent[0]) {
        throw new NotFound("Student not found");
    }

    if (existingStudent[0].avatar) {
        await deletePhotoFromServer(existingStudent[0].avatar);
    }

    await db.delete(students).where(eq(students.id, id));

    SuccessResponse(res, { message: "Student deleted successfully" }, 200);
};

export const selection= async(req: Request, res: Response) => {

    const getAllParents = await db.select().from(parents);
    SuccessResponse(res, { parents: getAllParents }, 200);
}