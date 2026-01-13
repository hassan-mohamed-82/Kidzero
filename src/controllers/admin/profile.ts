// src/controllers/admin/adminController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins, roles } from "../../models/schema";
import { eq, and, ne } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../Errors";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { saveBase64Image } from "../../utils/handleImages";

export const getProfile = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;
  const currentUserId = req.user?.id;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!currentUserId) {
    throw new UnauthorizedError("Not authenticated");
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
    })
    .from(admins)
    .where(
      and(
        eq(admins.id, currentUserId), // ✅ استخدم currentUserId مباشرة
        eq(admins.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!admin[0]) {
    throw new NotFound("Admin not found");
  }

  return SuccessResponse(res, { admin: admin[0] }, 200);
};


// ✅ Update Profile
export const updateProfile = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;
  const currentUserId = req.user?.id;
  const { name, phone, avatar, password } = req.body;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!currentUserId) {
    throw new UnauthorizedError("Not authenticated");
  }

  const admin = await db
    .select()
    .from(admins)
    .where(
      and(
        eq(admins.id, currentUserId),
        eq(admins.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!admin[0]) {
    throw new NotFound("Admin not found");
  }

  // Handle avatar upload
  let avatarUrl = admin[0].avatar;
  if (avatar && avatar.startsWith("data:image")) {
    // حذف الصورة القديمة لو موجودة
    if (admin[0].avatar) {
      await deletePhotoFromServer(admin[0].avatar);
    }
    // ✅ حفظ الصورة الجديدة - أضف req
    const savedImage = await saveBase64Image(req, avatar, "avatars");
    avatarUrl = savedImage.url;
  }

  const updatedData: any = {
    name: name ?? admin[0].name,
    phone: phone ?? admin[0].phone,
    avatar: avatarUrl,
  };

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updatedData.password = hashedPassword;
  }

  await db
    .update(admins)
    .set(updatedData)
    .where(
      and(
        eq(admins.id, currentUserId),
        eq(admins.organizationId, organizationId)
      )
    );

  return SuccessResponse(res, { message: "Profile updated successfully" }, 200);
};

// ✅ Delete Profile
export const deleteProfile = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;
  const currentUserId = req.user?.id;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!currentUserId) {
    throw new UnauthorizedError("Not authenticated");
  }

  const admin = await db
    .select()
    .from(admins)
    .where(
      and(
        eq(admins.id, currentUserId),
        eq(admins.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!admin[0]) {
    throw new NotFound("Admin not found");
  }

  // حذف الصورة لو موجودة
  if (admin[0].avatar) {
    await deletePhotoFromServer(admin[0].avatar);
  }

  await db.delete(admins).where(
    and(
      eq(admins.id, currentUserId),
      eq(admins.organizationId, organizationId)
    )
  );

  return SuccessResponse(res, { message: "Profile deleted successfully" }, 200);
};



