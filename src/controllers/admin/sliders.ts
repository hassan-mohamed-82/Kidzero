// controllers/slider.controller.ts
import { Request, Response } from "express";
import { db } from "../../models/db";
import { sliders, sliderImages } from "../../models/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { saveBase64Image } from "../../utils/handleImages";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors";
import { deletePhotoFromServer } from "../../utils/deleteImage";

export const createSlider = async (req: Request, res: Response) => {
  const { name, status, order, images } = req.body;
  const id = uuidv4();
  let newStatus = false;
  if (status === "active") newStatus = true;
  await db.insert(sliders).values({
    id,
    name,
    status: newStatus,
    order,
    createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
  });
  images.forEach(async (imagePath: any) => {
    const imageId = uuidv4();
    await db.insert(sliderImages).values({
      id: imageId,
      slider_id: id,
      image_path: await saveBase64Image(imagePath, imageId, req, "slider"),
    });
  });

  SuccessResponse(res, { message: "Slider created successfully" }, 201);
};

export const getAllSlidersForAdmin = async (req: Request, res: Response) => {
  const data = await db
    .select()
    .from(sliders)
    .leftJoin(sliderImages, eq(sliderImages.slider_id, sliders.id))
    .orderBy(sliders.createdAt);

  const groupedSliders = data.reduce((acc: any[], curr: any) => {
    const slider = curr.sliders;
    const image = curr.slider_images?.image_path || null;

    const existing = acc.find((s) => s.id === slider.id);

    if (existing) {
      if (image) existing.images.push(image);
    } else {
      acc.push({
        id: slider.id,
        name: slider.name,
        order: slider.order,
        status: slider.status,
        images: image ? [image] : [],
      });
    }

    return acc;
  }, []);

  SuccessResponse(res, { sliders: groupedSliders }, 200);
};

export const getSliderById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [slider] = await db.select().from(sliders).where(eq(sliders.id, id));
  if (!slider) throw new NotFound("Slider not found");
  const sliderImagesd = await db
    .select()
    .from(sliderImages)
    .where(eq(sliderImages.slider_id, id));
  SuccessResponse(res, { slider, sliderImagesd }, 200);
};

export const updateSlider = async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = req.body;

  await db.transaction(async (tx) => {
    // Update slider fields except images
    const { images, ...rest } = data;
    if (Object.keys(rest).length > 0) {
      await tx.update(sliders).set(rest).where(eq(sliders.id, id));
    }

    // Handle images logic
    if (Array.isArray(images)) {
      // 1. Delete given images (with id + image_path)
      const deletions = images.filter((img: any) => img.id && img.imagePath);

      for (const img of deletions) {
        await deletePhotoFromServer(new URL(img.imagePath).pathname);
        await tx.delete(sliderImages).where(eq(sliderImages.id, img.id));
      }

      // 2. Add new images (base64 only)
      const additions = images.filter(
        (img: any) =>
          !img.id && img.imagePath && img.imagePath.startsWith("data:")
      );

      for (const img of additions) {
        const imageId = uuidv4();
        const savedPath = await saveBase64Image(
          img.imagePath,
          imageId,
          req,
          "slider"
        );
        await tx.insert(sliderImages).values({
          id: imageId,
          slider_id: id,
          image_path: savedPath,
        });
      }
    }
  });

  SuccessResponse(res, { message: "Slider updated successfully" }, 200);
};

export const deleteSlider = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [slider] = await db.select().from(sliders).where(eq(sliders.id, id));
  if (!slider) throw new NotFound("Slider not found");

  const images = await db
    .select()
    .from(sliderImages)
    .where(eq(sliderImages.slider_id, id));

  for (const image of images) {
    if (image.image_path) {
      await deletePhotoFromServer(new URL(image.image_path).pathname); // or check return value
    }
  }
  await db.delete(sliders).where(eq(sliders.id, id));

  SuccessResponse(res, { message: "Slider deleted successfully" }, 200);
};

export const changeSliderStatus = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { status } = req.body;
  const [slider] = await db.select().from(sliders).where(eq(sliders.id, id));
  if (!slider) throw new NotFound("Slider Not Found");
  await db
    .update(sliders)
    .set({ status: status === "active" })
    .where(eq(sliders.id, id));
  SuccessResponse(res, { message: "Slider Updated Successfully" }, 200);
};
