"use strict";
// src/validations/parentValidation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentIdSchema = exports.updateParentSchema = exports.createParentSchema = void 0;
const zod_1 = require("zod");
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
exports.createParentSchema = zod_1.z.object({
    body: zod_1.z.object({
        fcm_tokens: zod_1.z.string().optional(),
        email: zod_1.z.string().email("Invalid email").optional(),
        name: zod_1.z
            .string({ required_error: "Parent name is required" })
            .min(1, "Parent name cannot be empty")
            .max(255, "Parent name cannot exceed 255 characters"),
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
        address: zod_1.z
            .string()
            .max(500, "Address cannot exceed 500 characters")
            .optional(),
        nationalId: zod_1.z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .optional(),
    }),
});
exports.updateParentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Parent ID"),
    }),
    body: zod_1.z.object({
        fcm_tokens: zod_1.z.string().optional(),
        email: zod_1.z.string().email("Invalid email").optional(),
        name: zod_1.z
            .string()
            .min(1, "Parent name cannot be empty")
            .max(255, "Parent name cannot exceed 255 characters")
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
        address: zod_1.z
            .string()
            .max(500, "Address cannot exceed 500 characters")
            .nullable()
            .optional(),
        nationalId: zod_1.z
            .string()
            .max(20, "National ID cannot exceed 20 characters")
            .nullable()
            .optional(),
        status: zod_1.z
            .enum(["active", "inactive"])
            .optional(),
    }),
});
exports.parentIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Parent ID"),
    }),
});
