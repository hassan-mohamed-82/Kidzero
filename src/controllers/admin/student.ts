// src/controllers/admin/studentController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { students, parents, zones } from "../../models/schema";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Student
export const createStudent = async (req: Request, res: Response) => {
    const { parentId, name, avatar, grade, classroom, zoneId } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    if (!zoneId) {
        throw new BadRequest("Zone ID is required");
    }

    // تحقق من الـ Parent
    const parent = await db
        .select()
        .from(parents)
        .where(and(eq(parents.id, parentId), eq(parents.organizationId, organizationId)))
        .limit(1);

    if (!parent[0]) {
        throw new NotFound("Parent not found");
    }

    // ✅ تحقق من الـ Zone (بدون organizationId)
    const zone = await db
        .select()
        .from(zones)
        .where(eq(zones.id, zoneId))
        .limit(1);

    if (!zone[0]) {
        throw new NotFound("Zone not found");
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
        zoneId,
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
            zone: {
                id: zones.id,
                name: zones.name,
            },
        })
        .from(students)
        .leftJoin(parents, eq(students.parentId, parents.id))
        .leftJoin(zones, eq(students.zoneId, zones.id))
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
            zone: {
                id: zones.id,
                name: zones.name,
            },
        })
        .from(students)
        .leftJoin(parents, eq(students.parentId, parents.id))
        .leftJoin(zones, eq(students.zoneId, zones.id))
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
    const { parentId, name, avatar, grade, classroom, status, zoneId } = req.body;
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

    // تحقق من الـ Parent الجديد
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

    // ✅ تحقق من الـ Zone الجديد (بدون organizationId)
    if (zoneId && zoneId !== existingStudent[0].zoneId) {
        const zone = await db
            .select()
            .from(zones)
            .where(eq(zones.id, zoneId))
            .limit(1);

        if (!zone[0]) {
            throw new NotFound("Zone not found");
        }
    }

    // معالجة الصورة
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

    // تحديث الطالب
    await db.update(students).set({
        parentId: parentId ?? existingStudent[0].parentId,
        zoneId: zoneId ?? existingStudent[0].zoneId,
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

// ✅ Selection (للـ Dropdowns)
export const selection = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allParents = await db
        .select({
            id: parents.id,
            name: parents.name,
            phone: parents.phone,
        })
        .from(parents)
        .where(eq(parents.organizationId, organizationId));

    // ✅ كل الـ zones (مشتركة)
    const allZones = await db
        .select({
            id: zones.id,
            name: zones.name,
            cost: zones.cost,
        })
        .from(zones);

    SuccessResponse(res, { 
        parents: allParents,
        zones: allZones,
    }, 200);
};