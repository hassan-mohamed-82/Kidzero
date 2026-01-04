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

export const createBanner = async (req: Request, res: Response) => {
  const { image } = req.body;
  const bannerId = uuidv4();

  await db.insert(banners).values({
    id: bannerId,
    imagePath: await saveBase64Image(image, bannerId, req, "banners"),
    createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
  });

  SuccessResponse(res, { message: "Banner created", bannerId }, 201);
};

export const getAllBanners = async (req: Request, res: Response) => {
  const allBanners = await db.select().from(banners);
  SuccessResponse(res, { banners: allBanners }, 200);
};

export const deleteBanner = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [banner] = await db.select().from(banners).where(eq(banners.id, id));
  if (!banner) throw new NotFound("Banner not found");

  await deletePhotoFromServer(new URL(banner.imagePath).pathname);
  await db.delete(banners).where(eq(banners.id, id));

  SuccessResponse(res, { message: "Banner deleted" }, 200);
};

export const getBanner = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [banner] = await db.select().from(banners).where(eq(banners.id, id));
  if (!banner) throw new NotFound("Banner not found");
  SuccessResponse(res, { banner }, 200);
};

export const updateBanner = async (req: Request, res: Response) => {
  const { image } = req.body;
  const id = req.params.id;
  const [banner] = await db.select().from(banners).where(eq(banners.id, id));
  if (!banner) throw new NotFound("Banner not found");

  const imagePath = banner.imagePath;
  const newImagePath = await saveBase64Image(image, id, req, "banners");
  await deletePhotoFromServer(new URL(imagePath).pathname);
  await db.update(banners).set({ imagePath: newImagePath }).where(eq(banners.id, id));
  SuccessResponse(res, { message: "Banner updated" }, 200);
};