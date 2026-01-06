"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminIdSchema = exports.updateAdminSchema = exports.createAdminSchema = void 0;
const zod_1 = require("zod");
exports.createAdminSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: "Name is required" })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        email: zod_1.z
            .string({ required_error: "Email is required" })
            .email("Invalid email format"),
        password: zod_1.z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        phone: zod_1.z
            .string()
            .max(20, "Phone cannot exceed 20 characters")
            .optional(),
        avatar: zod_1.z
            .string()
            .url("Avatar must be a valid URL")
            .optional(),
        roleId: zod_1.z
            .string()
            .uuid("Invalid Role ID")
            .optional(),
        type: zod_1.z
            .enum(["organizer", "admin"])
            .default("admin"),
    }),
});
exports.updateAdminSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Admin ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters")
            .optional(),
        email: zod_1.z
            .string()
            .email("Invalid email format")
            .optional(),
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .optional(),
        phone: zod_1.z
            .string()
            .max(20, "Phone cannot exceed 20 characters")
            .optional()
            .nullable(),
        avatar: zod_1.z
            .string()
            .url("Avatar must be a valid URL")
            .optional()
            .nullable(),
        roleId: zod_1.z
            .string()
            .uuid("Invalid Role ID")
            .optional()
            .nullable(),
        type: zod_1.z
            .enum(["organizer", "admin"])
            .optional(),
        status: zod_1.z
            .enum(["active", "inactive"])
            .optional(),
    }),
});
exports.adminIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Admin ID"),
    }),
});
