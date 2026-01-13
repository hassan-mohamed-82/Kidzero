import { z } from "zod";

export const createCitySchema = z.object({
  body: z.object({
    name: z.string().min(1, "City name is required").max(100, "City name is too long"),
  }),
});

export const updateCitySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid city ID"),
  }),
  body: z.object({
    name: z.string().min(1, "City name is required").max(100, "City name is too long").optional(),
  }),
});
