import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../../models/db";
import {banners } from "../../models/schema";
import { eq, asc } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { ConflictError, NotFound } from "../../Errors";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { v4 as uuidv4 } from "uuid"; 

export const getAllBanners = async (req: Request, res: Response) => {
  const allBanners = await db.select().from(banners);
  SuccessResponse(res, { banners: allBanners }, 200);
};


export const getBanner = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [banner] = await db.select().from(banners).where(eq(banners.id, id));
  if (!banner) throw new NotFound("Banner not found");
  SuccessResponse(res, { banner }, 200);
};
