// src/controllers/admin/studentController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { students, parents, zones } from "../../models/schema";
import { eq, and, isNull } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { v4 as uuidv4 } from "uuid";
import { generateUniqueStudentCode } from "../../utils/GenerateUniqueCode";

// ✅ Create Student (بدون Parent - بيتربط بعدين بالـ Code)
// src/controllers/admin/studentController.ts

export const createStudent = async (req: Request, res: Response) => {
  const { name, avatar, grade, classroom, zoneId } = req.body;
  
  // ✅ تأكد من استخدام req.admin مش req.user
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!name) {
    throw new BadRequest("Student name is required");
  }

  if (!zoneId) {
    throw new BadRequest("Zone ID is required");
  }

  // تحقق من الـ Zone
  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.id, zoneId))
    .limit(1);

  if (!zone) {
    throw new NotFound("Zone not found");
  }

  // Generate unique code
  const code = await generateUniqueStudentCode();
  const studentId = uuidv4();

  // معالجة الصورة
  let avatarUrl: string | null = null;
  if (avatar) {
    const result = await saveBase64Image(req, avatar, `students/${studentId}`);
    avatarUrl = result.url;
  }

  // ✅ الإدراج - بدون parentId خالص (هيكون null تلقائي)
  await db.insert(students).values({
    id: studentId,
    organizationId,
    // ❌ لا تضع parentId هنا - خليه يكون undefined فيتجاهله
    code,
    zoneId,
    name,
    avatar: avatarUrl,
    grade: grade || null,
    classroom: classroom || null,
  });

  return SuccessResponse(
    res,
    {
      message: "Student created successfully",
      student: {
        id: studentId,
        name,
        code, // ✅ الكود اللي هيديه الأدمن لولي الأمر
        grade,
        classroom,
        avatar: avatarUrl,
      },
    },
    201
  );
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
      code: students.code, // ✅
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      walletBalance: students.walletBalance, // ✅
      nfcId: students.nfcId, // ✅
      status: students.status,
      createdAt: students.createdAt,
      parentId: students.parentId,
      parentName: parents.name,
      parentPhone: parents.phone,
      zoneId: zones.id,
      zoneName: zones.name,
    })
    .from(students)
    .leftJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(zones, eq(students.zoneId, zones.id))
    .where(eq(students.organizationId, organizationId));

  const formattedStudents = allStudents.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    avatar: s.avatar,
    grade: s.grade,
    classroom: s.classroom,
    status: s.status,
    createdAt: s.createdAt,
    hasParent: !!s.parentId, // ✅
    hasNfc: !!s.nfcId, // ✅
    wallet: {
      balance: Number(s.walletBalance) || 0,
    },
    parent: s.parentId
      ? {
          id: s.parentId,
          name: s.parentName,
          phone: s.parentPhone,
        }
      : null,
    zone: s.zoneId
      ? {
          id: s.zoneId,
          name: s.zoneName,
        }
      : null,
  }));

  SuccessResponse(res, { students: formattedStudents }, 200);
};

// ✅ Get Student By ID
export const getStudentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      code: students.code,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      walletBalance: students.walletBalance,
      nfcId: students.nfcId,
      status: students.status,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
      parentId: students.parentId,
      parentName: parents.name,
      parentPhone: parents.phone,
      parentEmail: parents.email,
      parentAddress: parents.address,
      zoneId: zones.id,
      zoneName: zones.name,
      zoneCost: zones.cost,
    })
    .from(students)
    .leftJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(zones, eq(students.zoneId, zones.id))
    .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
    .limit(1);

  if (!student) {
    throw new NotFound("Student not found");
  }

  SuccessResponse(
    res,
    {
      student: {
        id: student.id,
        name: student.name,
        code: student.code,
        avatar: student.avatar,
        grade: student.grade,
        classroom: student.classroom,
        status: student.status,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        hasParent: !!student.parentId,
        hasNfc: !!student.nfcId,
        wallet: {
          balance: Number(student.walletBalance) || 0,
        },
        parent: student.parentId
          ? {
              id: student.parentId,
              name: student.parentName,
              phone: student.parentPhone,
              email: student.parentEmail,
              address: student.parentAddress,
            }
          : null,
        zone: student.zoneId
          ? {
              id: student.zoneId,
              name: student.zoneName,
              cost: student.zoneCost,
            }
          : null,
      },
    },
    200
  );
};

// ✅ Update Student
export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, avatar, grade, classroom, status, zoneId } = req.body;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const [existingStudent] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
    .limit(1);

  if (!existingStudent) {
    throw new NotFound("Student not found");
  }

  // تحقق من الـ Zone الجديد
  if (zoneId && zoneId !== existingStudent.zoneId) {
    const [zone] = await db
      .select()
      .from(zones)
      .where(eq(zones.id, zoneId))
      .limit(1);

    if (!zone) {
      throw new NotFound("Zone not found");
    }
  }

  // معالجة الصورة
  let avatarUrl = existingStudent.avatar;
  if (avatar !== undefined) {
    if (existingStudent.avatar) {
      await deletePhotoFromServer(existingStudent.avatar);
    }
    if (avatar) {
      const result = await saveBase64Image(req, avatar, `students/${id}`);
      avatarUrl = result.url;
    } else {
      avatarUrl = null;
    }
  }

  await db
    .update(students)
    .set({
      zoneId: zoneId ?? existingStudent.zoneId,
      name: name ?? existingStudent.name,
      avatar: avatarUrl,
      grade: grade !== undefined ? grade : existingStudent.grade,
      classroom: classroom !== undefined ? classroom : existingStudent.classroom,
      status: status ?? existingStudent.status,
    })
    .where(eq(students.id, id));

  SuccessResponse(res, { message: "Student updated successfully" }, 200);
};

// ✅ Delete Student
export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const [existingStudent] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
    .limit(1);

  if (!existingStudent) {
    throw new NotFound("Student not found");
  }

  if (existingStudent.avatar) {
    await deletePhotoFromServer(existingStudent.avatar);
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

  // ✅ كل الـ zones (مشتركة)
  const allZones = await db
    .select({
      id: zones.id,
      name: zones.name,
      cost: zones.cost,
    })
    .from(zones);

  SuccessResponse(
    res,
    {
      zones: allZones,
    },
    200
  );
};

// ✅ Get Students Without Parent (الطلاب اللي مش مربوطين بولي أمر)
export const getStudentsWithoutParent = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const studentsWithoutParent = await db
    .select({
      id: students.id,
      name: students.name,
      code: students.code,
      grade: students.grade,
      classroom: students.classroom,
      createdAt: students.createdAt,
    })
    .from(students)
    .where(
      and(
        eq(students.organizationId, organizationId),
        isNull(students.parentId)
      )
    );

  SuccessResponse(
    res,
    {
      students: studentsWithoutParent,
      count: studentsWithoutParent.length,
    },
    200
  );
};


