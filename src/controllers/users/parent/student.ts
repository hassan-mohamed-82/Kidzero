// src/controllers/mobile/parentController.ts

import { Request, Response } from "express";
import { db } from "../../../models/db";
import {
  students,
  parents,
  rides,
  rideStudents,
  buses,
  drivers,
  codrivers,
  Rout,
  routePickupPoints,
  pickupPoints,
} from "../../../models/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";
import { UnauthorizedError } from "../../../Errors";

// ===================== CHILDREN =====================

// ✅ Get My Children
export const getMyChildren = async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new UnauthorizedError("Not authenticated");
  }

  const children = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      status: students.status,
    })
    .from(students)
    .where(eq(students.parentId, parentId));

  SuccessResponse(res, { children }, 200);
};

// ✅ Get Child Details
export const getChildDetails = async (req: Request, res: Response) => {
  const { childId } = req.params;
  const parentId = req.user?.id;

  if (!parentId) {
    throw new UnauthorizedError("Not authenticated");
  }

  const child = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      status: students.status,
      createdAt: students.createdAt,
    })
    .from(students)
    .where(and(eq(students.id, childId), eq(students.parentId, parentId)))
    .limit(1);

  if (!child[0]) {
    throw new NotFound("Child not found");
  }

  SuccessResponse(res, { child: child[0] }, 200);
};
