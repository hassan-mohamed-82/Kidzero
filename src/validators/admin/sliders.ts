// validations/slider.ts
import { z } from "zod";

export const createSliderSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    status: z.enum(["active", "disabled"]).optional(),
    order: z.number().int(),
    images: z.array(z.string().min(1)), // base64 or imagePath strings
  }),
});

export const updateSliderSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    status: z.enum(["active", "disabled"]).optional(),
    order: z.number().int().optional(),
    images: z.array(z.any()).optional(),
  }),
});

export const changeStatus = z.object({
  body: z.object({
    status: z.enum(["active", "disabled"]),
  }),
});
