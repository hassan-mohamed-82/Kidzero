import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string(),
    description: z.string(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
});
