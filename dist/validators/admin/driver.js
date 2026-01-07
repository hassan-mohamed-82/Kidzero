"use strict";
// src/validations/driverValidation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverIdSchema = exports.updateDriverSchema = exports.createDriverSchema = void 0;
const zod_1 = require("zod");
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
exports.createDriverSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: "Driver name is required" })
            .min(1, "Driver name cannot be empty")
            .max(255, "Driver name cannot exceed 255 characters"),
        phone: zod_1.z
            .string({ required_error: "Phone number is required" })
            .min(10, "Phone number must be at least 10 digits")
            .max(20, "Phone number cannot exceed 20 characters"),
        password: zod_1.z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        avatar: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format. Must be a base64 encoded image")
            .optional(),
        licenseExpiry: zod_1.z
            .string()
            .datetime("Invalid date format")
            .optional(),
        licenseImage: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid license image format. Must be a base64 encoded image")
            .optional(),
        nationalId: zod_1.z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .optional(),
        nationalIdImage: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid national ID image format. Must be a base64 encoded image")
            .optional(),
    }),
});
exports.updateDriverSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Driver ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, "Driver name cannot be empty")
            .max(255, "Driver name cannot exceed 255 characters")
            .optional(),
        phone: zod_1.z
            .string()
            .min(10, "Phone number must be at least 10 digits")
            .max(20, "Phone number cannot exceed 20 characters")
            .optional(),
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .optional(),
        avatar: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format. Must be a base64 encoded image")
            .nullable()
            .optional(),
        licenseExpiry: zod_1.z
            .string()
            .datetime("Invalid date format")
            .nullable()
            .optional(),
        licenseImage: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid license image format. Must be a base64 encoded image")
            .nullable()
            .optional(),
        nationalId: zod_1.z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .nullable()
            .optional(),
        nationalIdImage: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid national ID image format. Must be a base64 encoded image")
            .nullable()
            .optional(),
        status: zod_1.z
            .enum(["active", "inactive"])
            .optional(),
    }),
});
exports.driverIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Driver ID"),
    }),
});
