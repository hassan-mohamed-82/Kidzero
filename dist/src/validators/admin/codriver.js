"use strict";
// src/validations/codriverValidation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.codriverIdSchema = exports.updateCodriverSchema = exports.createCodriverSchema = void 0;
const zod_1 = require("zod");
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
exports.createCodriverSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: "Codriver name is required" })
            .min(1, "Codriver name cannot be empty")
            .max(255, "Codriver name cannot exceed 255 characters"),
        fcm_tokens: zod_1.z.string().optional(),
        phone: zod_1.z
            .string({ required_error: "Phone number is required" })
            .min(10, "Phone number must be at least 10 digits")
            .max(20, "Phone number cannot exceed 20 characters"),
        password: zod_1.z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        avatar: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .optional(),
        nationalId: zod_1.z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .optional(),
        nationalIdImage: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid national ID image format")
            .optional(),
    }),
});
exports.updateCodriverSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Codriver ID"),
    }),
    body: zod_1.z.object({
        fcm_tokens: zod_1.z.string().optional(),
        name: zod_1.z
            .string()
            .min(1, "Codriver name cannot be empty")
            .max(255, "Codriver name cannot exceed 255 characters")
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
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .nullable()
            .optional(),
        nationalId: zod_1.z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .nullable()
            .optional(),
        nationalIdImage: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid national ID image format")
            .nullable()
            .optional(),
        status: zod_1.z
            .enum(["active", "inactive"])
            .optional(),
    }),
});
exports.codriverIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Codriver ID"),
    }),
});
