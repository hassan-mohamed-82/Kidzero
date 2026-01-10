// src/validators/departmentValidator.ts

import { z } from "zod";

// Schema للـ Create
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
  }),
});

// Schema للـ Update
export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid department ID"),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
  }),
});

// Schema للـ ID
export const departmentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid department ID"),
  }),
});
