import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../../models/db";
import { users } from "../../models/schema";
import { eq, asc } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { ConflictError, NotFound } from "../../Errors";
import { saveBase64Image } from "../../utils/handleImages";
import { sendEmail } from "../../utils/sendEmails";
import { deletePhotoFromServer } from "../../utils/deleteImage";

export const getAllUsers = async (req: Request, res: Response) => {
  const allUsers = await db.select().from(users).orderBy(asc(users.createdAt));

  const formattedUsers = allUsers.map((user) => ({
    ...user,
    dateOfBirth: user.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
      : null,
  }));

  SuccessResponse(res, { users: formattedUsers }, 200);
};

export const getUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [user] = await db.select().from(users).where(eq(users.id, id));

  if (!user) throw new NotFound("User not found");

  const formattedUser = {
    ...user,
    dateOfBirth: user.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
      : null,
  };

  SuccessResponse(res, formattedUser, 200);
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const newUser = req.body;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new NotFound("User not found");

  if (newUser.password) {
    newUser.hashedPassword = await bcrypt.hash(newUser.password, 10);
    delete newUser.password;
  }

  if (newUser.imageBase64) {
    if (user.imagePath) {
      const deleted = await deletePhotoFromServer(user.imagePath);
      if (!deleted)
        throw new ConflictError("Failed to delete old user image from server");
    }
    newUser.imagePath = await saveBase64Image(
      newUser.imageBase64,
      id,
      req,
      "users"
    );
  }

  await db.update(users).set(newUser).where(eq(users.id, id));

  SuccessResponse(res, { message: "User Updated successfully" }, 200);
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotFound("User not found");
  if (user.imagePath) {
    const deleted = await deletePhotoFromServer(
      new URL(user.imagePath).pathname
    );
    if (!deleted)
      throw new ConflictError("Failed to delete user image from server");
  }

  await db.delete(users).where(eq(users.id, id));

  SuccessResponse(res, { message: "User deleted successfully" }, 200);
};

export const approveUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotFound("User not found");
  const result = await db
    .update(users)
    .set({
      status: "approved",
      updatedAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone if needed
    })
    .where(eq(users.id, id));
  await sendEmail(
    user.email,
    "Your account has been approved",
    "Congratulations! Your account has been approved by the admin. You can now log in and start using our services."
  );
  SuccessResponse(res, { message: "User approved successfully" }, 200);
};

export const rejectUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { rejectionReason } = req.body;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotFound("User not found");
  const result = await db
    .update(users)
    .set({
      status: "rejected",
      updatedAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone if needed
      rejectionReason: rejectionReason,
    })
    .where(eq(users.id, id));
  await sendEmail(
    user.email,
    "Your account has been Rejected",
    "Unfortunately, your account was rejected. The Reason is " +
      user.rejectionReason
  );
  SuccessResponse(res, { message: "User rejected successfully" }, 200);
};

export const getAllRejectedUsers = async (req: Request, res: Response) => {
  const allRejectedUsers = await db
    .select()
    .from(users)
    .where(eq(users.status, "rejected"));
  SuccessResponse(res, { users: allRejectedUsers }, 200);
};

export const getAllPendingUsers = async (req: Request, res: Response) => {
  const allRejectedUsers = await db
    .select()
    .from(users)
    .where(eq(users.status, "pending"));
  SuccessResponse(res, { users: allRejectedUsers }, 200);
};
