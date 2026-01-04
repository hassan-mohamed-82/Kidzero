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


