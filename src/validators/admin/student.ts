// src/validations/studentValidation.ts

import { z } from "zod";

const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

export const createStudentSchema = z.object({
    body: z.object({
        parentId: z
            .string({ required_error: "Parent ID is required" })
            .uuid("Invalid Parent ID"),
        name: z
            .string({ required_error: "Student name is required" })
            .min(1, "Student name cannot be empty")
            .max(255, "Student name cannot exceed 255 characters"),
        avatar: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .optional(),
        grade: z
            .string()
            .max(50, "Grade cannot exceed 50 characters")
            .optional(),
        classroom: z
            .string()
            .max(50, "Classroom cannot exceed 50 characters")
            .optional(),
    }),
});

export const updateStudentSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Student ID"),
    }),
    body: z.object({
        parentId: z
            .string()
            .uuid("Invalid Parent ID")
            .optional(),
        name: z
            .string()
            .min(1, "Student name cannot be empty")
            .max(255, "Student name cannot exceed 255 characters")
            .optional(),
        avatar: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .nullable()
            .optional(),
        grade: z
            .string()
            .max(50, "Grade cannot exceed 50 characters")
            .nullable()
            .optional(),
        classroom: z
            .string()
            .max(50, "Classroom cannot exceed 50 characters")
            .nullable()
            .optional(),
        status: z
            .enum(["active", "inactive"])
            .optional(),
    }),
});

export const studentIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Student ID"),
    }),
});
