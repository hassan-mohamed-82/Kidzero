
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


// ✅ Get My Profile (لكل الأنواع)
export const getMyProfile = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedError("Not authenticated");
  }

  let profile: any = null;

  if (user.role === "driver") {
    const driver = await db
      .select({
        id: drivers.id,
        name: drivers.name,
        phone: drivers.phone,
        avatar: drivers.avatar,
        licenseExpiry: drivers.licenseExpiry,
        status: drivers.status,
      })
      .from(drivers)
      .where(eq(drivers.id, user.id))
      .limit(1);

    profile = driver[0];
  } else if (user.role === "codriver") {
    const codriver = await db
      .select({
        id: codrivers.id,
        name: codrivers.name,
        phone: codrivers.phone,
        avatar: codrivers.avatar,
        status: codrivers.status,
      })
      .from(codrivers)
      .where(eq(codrivers.id, user.id))
      .limit(1);

    profile = codriver[0];
  } else if (user.role === "parent") {
    const parent = await db
      .select({
        id: parents.id,
        name: parents.name,
        phone: parents.phone,
        avatar: parents.avatar,
        address: parents.address,
        status: parents.status,
      })
      .from(parents)
      .where(eq(parents.id, user.id))
      .limit(1);

    const children = await db
      .select({
        id: students.id,
        name: students.name,
        avatar: students.avatar,
        grade: students.grade,
        classroom: students.classroom,
      })
      .from(students)
      .where(eq(students.parentId, user.id));

    profile = { ...parent[0], children };
  }

  if (!profile) {
    throw new NotFound("Profile not found");
  }

  SuccessResponse(res, { profile: { ...profile, role: user.role } }, 200);
};

// ✅ Change Password
export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.user;

  if (!user) {
    throw new UnauthorizedError("Not authenticated");
  }

  let currentPassword: string | null = null;
  let table: any = null;

  if (user.role === "driver") {
    const driver = await db
      .select({ password: drivers.password })
      .from(drivers)
      .where(eq(drivers.id, user.id))
      .limit(1);
    currentPassword = driver[0]?.password;
    table = drivers;
  } else if (user.role === "codriver") {
    const codriver = await db
      .select({ password: codrivers.password })
      .from(codrivers)
      .where(eq(codrivers.id, user.id))
      .limit(1);
    currentPassword = codriver[0]?.password;
    table = codrivers;
  } else if (user.role === "parent") {
    const parent = await db
      .select({ password: parents.password })
      .from(parents)
      .where(eq(parents.id, user.id))
      .limit(1);
    currentPassword = parent[0]?.password;
    table = parents;
  }

  if (!currentPassword) {
    throw new NotFound("User not found");
  }

  const isValidPassword = await bcrypt.compare(oldPassword, currentPassword);
  if (!isValidPassword) {
    throw new BadRequest("Old password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(table)
    .set({ password: hashedPassword })
    .where(eq(table.id, user.id));

  SuccessResponse(res, { message: "Password changed successfully" }, 200);
};

// ✅ Update Profile
export const updateProfile = async (req: Request, res: Response) => {
  const { name, avatar, address } = req.body;
  const user = req.user;

  if (!user) {
    throw new UnauthorizedError("Not authenticated");
  }

  const updateData: any = {};
  if (name) updateData.name = name;
  if (avatar !== undefined) updateData.avatar = avatar;

  if (user.role === "driver") {
    await db.update(drivers).set(updateData).where(eq(drivers.id, user.id));
  } else if (user.role === "codriver") {
    await db.update(codrivers).set(updateData).where(eq(codrivers.id, user.id));
  } else if (user.role === "parent") {
    if (address !== undefined) updateData.address = address;
    await db.update(parents).set(updateData).where(eq(parents.id, user.id));
  }

  SuccessResponse(res, { message: "Profile updated successfully" }, 200);
};
