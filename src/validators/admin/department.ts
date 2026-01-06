import { z } from "zod";

// Schema للـ Create
export const createDepartmentSchema = z.object({
    name: z.string().min(2).max(100),
});

// Schema للـ Update
export const updateDepartmentSchema = z.object({
    name: z.string().min(2).max(100).optional(),
});