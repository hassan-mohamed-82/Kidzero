// src/controllers/mobile/authController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { drivers, codrivers, parents, students } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { UnauthorizedError } from "../../Errors";
import bcrypt from "bcrypt";
import {
  generateDriverToken,
  generateCoDriverToken,
  generateParentToken,
} from "../../utils/auth";

// ✅ Parent Login (Parent App)
export const parentLogin = async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  const parent = await db
    .select()
    .from(parents)
    .where(eq(parents.phone, phone))
    .limit(1);

  if (!parent[0]) {
    throw new UnauthorizedError("Invalid phone number or password");
  }

  if (parent[0].status === "inactive") {
    throw new UnauthorizedError("Your account is inactive. Please contact admin.");
  }

  const isValidPassword = await bcrypt.compare(password, parent[0].password);
  if (!isValidPassword) {
    throw new UnauthorizedError("Invalid phone number or password");
  }

  // جلب الأبناء
  const children = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
    })
    .from(students)
    .where(eq(students.parentId, parent[0].id));

  const token = generateParentToken({
    id: parent[0].id,
    name: parent[0].name,
    organizationId: parent[0].organizationId,
  });

  SuccessResponse(
    res,
    {
      message: "Login successful",
      token,
      user: {
        id: parent[0].id,
        name: parent[0].name,
        phone: parent[0].phone,
        avatar: parent[0].avatar,
        address: parent[0].address,
        role: "parent",
        children,
      },
    },
    200
  );
};

// ✅ Driver/CoDriver Login (Driver App)
export const driverAppLogin = async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  // 1. البحث في جدول الـ Drivers
  const driver = await db
    .select()
    .from(drivers)
    .where(eq(drivers.phone, phone))
    .limit(1);

  if (driver[0]) {
    if (driver[0].status === "inactive") {
      throw new UnauthorizedError("Your account is inactive. Please contact admin.");
    }

    const isValidPassword = await bcrypt.compare(password, driver[0].password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid phone number or password");
    }

    const token = generateDriverToken({
      id: driver[0].id,
      name: driver[0].name,
      organizationId: driver[0].organizationId,
    });

    return SuccessResponse(
      res,
      {
        message: "Login successful",
        token,
        user: {
          id: driver[0].id,
          name: driver[0].name,
          phone: driver[0].phone,
          avatar: driver[0].avatar,
          role: "driver",
        },
      },
      200
    );
  }

  // 2. البحث في جدول الـ CoDrivers
  const codriver = await db
    .select()
    .from(codrivers)
    .where(eq(codrivers.phone, phone))
    .limit(1);

  if (codriver[0]) {
    if (codriver[0].status === "inactive") {
      throw new UnauthorizedError("Your account is inactive. Please contact admin.");
    }

    const isValidPassword = await bcrypt.compare(password, codriver[0].password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid phone number or password");
    }

    const token = generateCoDriverToken({
      id: codriver[0].id,
      name: codriver[0].name,
      organizationId: codriver[0].organizationId,
    });

    return SuccessResponse(
      res,
      {
        message: "Login successful",
        token,
        user: {
          id: codriver[0].id,
          name: codriver[0].name,
          phone: codriver[0].phone,
          avatar: codriver[0].avatar,
          role: "codriver",
        },
      },
      200
    );
  }

  throw new UnauthorizedError("Invalid phone number or password");
};

