// src/validators/mobileAuthValidator.ts

import { z } from "zod";

// Login موحد - يدعم الدخول بالهاتف أو الإيميل
export const mobileLoginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ required_error: "البريد الإلكتروني أو رقم الهاتف مطلوب" })
      .min(1, "البريد الإلكتروني أو رقم الهاتف مطلوب"),
    password: z
      .string({ required_error: "كلمة المرور مطلوبة" })
      .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  }),
});

// Change Password
export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6, "Old password must be at least 6 characters"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  }),
});

// Update Profile
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    avatar: z.string().max(500).optional(),
    address: z.string().max(500).optional(),
  }),
});