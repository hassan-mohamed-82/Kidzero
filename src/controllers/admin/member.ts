import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../../models/db";
import {members } from "../../models/schema";
import { eq, asc } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { ConflictError, NotFound } from "../../Errors";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { v4 as uuidv4 } from "uuid"; 

export const createMember = async (req: Request, res: Response) => {
  const { name, photo, description, layer, number } = req.body;
  const memberId = uuidv4();

  await db.insert(members).values({
    id: memberId,
    name,
    photo: await saveBase64Image(photo, memberId, req, "members"),
    description,
    layer,
    number,
    createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
  });

  SuccessResponse(res, { message: "Member created", memberId }, 201);
};


export const getAllMembers = async (req: Request, res: Response) => {
  const allMembers = await db.select().from(members);
  SuccessResponse(res, { members: allMembers }, 200);
};

export const getMember = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [member] = await db.select().from(members).where(eq(members.id, id));
  if (!member) throw new NotFound("Member not found");
  SuccessResponse(res, { member }, 200);
};


export const updateMember = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { name, photo, description,layer , number } = req.body;

  const [existingMember] = await db.select().from(members).where(eq(members.id, id));
  if (!existingMember) throw new NotFound("Member not found");

  let photoPath = existingMember.photo;
  
  if (photo && photo.startsWith("data:")) {
    await deletePhotoFromServer(new URL(photoPath).pathname);
    photoPath = await saveBase64Image(photo, id, req, "members");
  }


  await db.update(members).set({
    name,
    photo: photoPath,
    description,
    layer,
    number,
  }).where(eq(members.id, id));

  SuccessResponse(res, { message: "Member updated" }, 200);
};


export const deleteMember = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [member] = await db.select().from(members).where(eq(members.id, id));
  if (!member) throw new NotFound("Member not found");

  await deletePhotoFromServer(new URL(member.photo).pathname);
  
  await db.delete(members).where(eq(members.id, id));
  SuccessResponse(res, { message: "Member deleted" }, 200);
};
