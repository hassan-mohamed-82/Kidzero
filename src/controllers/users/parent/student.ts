// src/controllers/users/parent/rides.ts

import { Request, Response } from "express";
import { db } from "../../../models/db";
import {
  students,
  rides,
  rideStudents,
  rideOccurrences,
  rideOccurrenceStudents,
  buses,
  drivers,
  Rout,
  pickupPoints,
  routePickupPoints,
  organizations,
} from "../../../models/schema";
import { eq, and, sql, inArray, desc, gte, lte, asc } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";
import { UnauthorizedError } from "../../../Errors";

// ================== Add Child (محدّث) ==================

export const addChild = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { code } = req.body;

  if (!parentId) {
    throw new UnauthorizedError("غير مصرح");
  }

  if (!code) {
    throw new BadRequest("كود الطالب مطلوب");
  }

  // Find student by code
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.code, code.toUpperCase().trim()))
    .limit(1);

  if (!student) {
    throw new NotFound("كود الطالب غير صحيح");
  }

  if (student.parentId) {
    throw new BadRequest("هذا الطالب مرتبط بولي أمر آخر");
  }

  // ✅ ربط الطالب بولي الأمر فقط (بدون تحديث organizationId في Parent)
  await db
    .update(students)
    .set({ parentId })
    .where(eq(students.id, student.id));

  return SuccessResponse(
    res,
    {
      message: "تم إضافة الطفل بنجاح",
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        classroom: student.classroom,
        code: student.code,
        organizationId: student.organizationId, // ✅ إرجاع الـ org للـ Frontend
        wallet: {
          balance: Number(student.walletBalance) || 0,
        },
      },
    },
    200
  );
};

// ================== Get My Children (محدّث - مع Organization) ==================

export const getMyChildren = async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new UnauthorizedError("غير مصرح");
  }

  const children = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      code: students.code,
      walletBalance: students.walletBalance,
      nfcId: students.nfcId,
      status: students.status,
      organizationId: students.organizationId,
      organizationName: organizations.name, // ✅ اسم المدرسة
      organizationLogo: organizations.logo, // ✅ لوجو المدرسة
    })
    .from(students)
    .leftJoin(organizations, eq(students.organizationId, organizations.id))
    .where(eq(students.parentId, parentId));

  // ✅ Group by organization
  const childrenByOrg = children.reduce((acc: any, child) => {
    const orgId = child.organizationId;
    if (!acc[orgId]) {
      acc[orgId] = {
        organization: {
          id: child.organizationId,
          name: child.organizationName,
          logo: child.organizationLogo,
        },
        children: [],
      };
    }
    acc[orgId].children.push({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      grade: child.grade,
      classroom: child.classroom,
      code: child.code,
      status: child.status,
      hasNfc: !!child.nfcId,
      wallet: {
        balance: Number(child.walletBalance) || 0,
      },
    });
    return acc;
  }, {});

  return SuccessResponse(
    res,
    {
      children: children.map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        grade: c.grade,
        classroom: c.classroom,
        code: c.code,
        status: c.status,
        hasNfc: !!c.nfcId,
        wallet: {
          balance: Number(c.walletBalance) || 0,
        },
        organization: {
          id: c.organizationId,
          name: c.organizationName,
          logo: c.organizationLogo,
        },
      })),
      // ✅ Grouped by organization
      byOrganization: Object.values(childrenByOrg),
      totalChildren: children.length,
    },
    200
  );
};
