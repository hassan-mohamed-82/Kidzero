import { Request, Response } from "express";
import { db } from "../../models/db";
import { sliderImages, sliders } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";

export const getActiveSliders = async (req: Request, res: Response) => {
  const data = await db
    .select()
    .from(sliders)
    .where(eq(sliders.status, true))
    .leftJoin(sliderImages, eq(sliderImages.slider_id, sliders.id))
    .orderBy(sliders.order);

  SuccessResponse(res, { sliders: data }, 200);
};
