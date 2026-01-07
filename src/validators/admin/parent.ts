// src/validations/parentValidation.ts

import { z } from "zod";

const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

export const createParentSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Parent name is required" })
            .min(1, "Parent name cannot be empty")
            .max(255, "Parent name cannot exceed 255 characters"),
        phone: z
            .string({ required_error: "Phone number is required" })
            .min(10, "Phone number must be at least 10 digits")
            .max(20, "Phone number cannot exceed 20 characters"),
        password: z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        avatar: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .optional(),
        address: z
            .string()
            .max(500, "Address cannot exceed 500 characters")
            .optional(),
        nationalId: z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .optional(),
    }),
});

export const updateParentSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Parent ID"),
    }),
    body: z.object({
        name: z
            .string()
            .min(1, "Parent name cannot be empty")
            .max(255, "Parent name cannot exceed 255 characters")
            .optional(),
        phone: z
            .string()
            .min(10, "Phone number must be at least 10 digits")
            .max(20, "Phone number cannot exceed 20 characters")
            .optional(),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .optional(),
        avatar: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .nullable()
            .optional(),
        address: z
            .string()
            .max(500, "Address cannot exceed 500 characters")
            .nullable()
            .optional(),
        nationalId: z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .nullable()
            .optional(),
        status: z
            .enum(["active", "inactive"])
            .optional(),
    }),
});

export const parentIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Parent ID"),
    }),
});
