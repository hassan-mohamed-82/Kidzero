// src/validators/mobileAuthValidator.ts

import { z } from "zod";

// Login موحد
export const mobileLoginSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(20, "Phone number must be at most 20 digits")
      .regex(/^[0-9+]+$/, "Phone number must contain only digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
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