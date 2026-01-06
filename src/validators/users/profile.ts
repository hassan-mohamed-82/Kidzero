import { z } from "zod";

export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255).optional(),
    purpose: z.string().max(1000).optional(),
    imagePath: z.string().optional(), 
    dateOfBirth: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
      })
      .optional(),
  }),
});
