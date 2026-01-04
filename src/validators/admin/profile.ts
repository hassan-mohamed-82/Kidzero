import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email("invalid email").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
  }),
});
