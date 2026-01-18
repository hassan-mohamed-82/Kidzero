// src/validations/driverValidation.ts

import { z } from "zod";

const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

export const createDriverSchema = z.object({
    body: z.object({
                fcm_tokens: z.string().optional(),
          email: z.string().email("Invalid email format"),
        name: z
            .string({ required_error: "Driver name is required" })
            .min(1, "Driver name cannot be empty")
            .max(255, "Driver name cannot exceed 255 characters"),
        phone: z
            .string({ required_error: "Phone number is required" })
            .min(10, "Phone number must be at least 10 digits")
            .max(20, "Phone number cannot exceed 20 characters"),
        password: z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        avatar: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format. Must be a base64 encoded image")
            .optional(),
        licenseExpiry: z
            .string()
            .datetime("Invalid date format")
            .optional(),
        licenseImage: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid license image format. Must be a base64 encoded image")
            .optional(),
        nationalId: z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .optional(),
        nationalIdImage: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid national ID image format. Must be a base64 encoded image")
            .optional(),
    }),
});

export const updateDriverSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Driver ID"),
    }),
    body: z.object({
                fcm_tokens: z.string().optional(),
          email: z.string().email("Invalid email format").optional(),
        name: z
            .string()
            .min(1, "Driver name cannot be empty")
            .max(255, "Driver name cannot exceed 255 characters")
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
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format. Must be a base64 encoded image")
            .nullable()
            .optional(),
        licenseExpiry: z
            .string()
            .datetime("Invalid date format")
            .nullable()
            .optional(),
        licenseImage: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid license image format. Must be a base64 encoded image")
            .nullable()
            .optional(),
        nationalId: z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .nullable()
            .optional(),
        nationalIdImage: z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid national ID image format. Must be a base64 encoded image")
            .nullable()
            .optional(),
        status: z
            .enum(["active", "inactive"])
            .optional(),
    }),
});

export const driverIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Driver ID"),
    }),
});
