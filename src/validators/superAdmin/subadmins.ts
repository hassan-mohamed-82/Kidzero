// src/validators/subAdminValidator.ts

import { z } from "zod";

export const createSubAdminSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(255),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    roleId: z.string().uuid("Invalid role ID").optional(),
  }),
});

export const updateSubAdminSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid SubAdmin ID"),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(6).optional(),
    roleId: z.string().uuid("Invalid role ID").nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const subAdminIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid SubAdmin ID"),
  }),
});
