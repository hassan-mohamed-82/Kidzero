import { z } from "zod";

export const createZoneSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Zone name is required").max(100, "Zone name is too long"),
    cityId: z.string().uuid("Invalid city ID"),
    cost: z.number().min(0, "Cost must be at least 0"),
  }),
});

export const updateZoneSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid zone ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Zone name is required").max(100, "Zone name is too long").optional(),
    cityId: z.string().uuid("Invalid city ID").optional(),
    cost: z.number().min(0, "Cost must be at least 0").optional(),  
    }),
});