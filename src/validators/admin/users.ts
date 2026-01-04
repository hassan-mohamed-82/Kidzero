import { z } from "zod";
import { signupSchema } from "../users/auth";

// export const updateUserSchema = z.object({
//   body: signupSchema.partial().optional(),
// });

export const updateUserSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 3, {
          message: "Name must be at least 2 characters",
        }),

      email: z
        .string()
        .optional()
        .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
          message: "Invalid email address",
        }),

      phoneNumber: z.string().optional(),

      role: z
        .string()
        .optional()
        .refine((val) => !val || ["member", "guest"].includes(val), {
          message: "Role must be one of: admin, member, guest",
        }),

      password: z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 8, {
          message:
            "Password must be at least 8 characters and include upper, lower, and number",
        }),

      imageBase64: z.string().optional(),

      dateOfBirth: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "Date of birth must be a valid date string",
        }),
    })
    .superRefine((data, ctx) => {
      if (data.imageBase64 && !data.imageBase64.startsWith("data:image/")) {
        ctx.addIssue({
          path: ["imageBase64"],
          code: z.ZodIssueCode.custom,
          message: "Valid base64 image is required",
        });
      }
    }),
});
