"use strict";
// src/validators/busSchema.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.busIdSchema = exports.updateBusSchema = exports.createBusSchema = void 0;
const zod_1 = require("zod");
exports.createBusSchema = zod_1.z.object({
    body: zod_1.z.object({
        busTypeId: zod_1.z
            .string({ required_error: "Bus Type ID is required" })
            .uuid("Invalid Bus Type ID"),
        busNumber: zod_1.z
            .string({ required_error: "Bus Number is required" })
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters"),
        plateNumber: zod_1.z
            .string({ required_error: "Plate Number is required" })
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters"),
        model: zod_1.z
            .string()
            .max(100, "Model cannot exceed 100 characters")
            .optional(),
        color: zod_1.z
            .string()
            .max(50, "Color cannot exceed 50 characters")
            .optional(),
        year: zod_1.z
            .number()
            .int("Year must be an integer")
            .min(1900, "Year must be at least 1900")
            .max(new Date().getFullYear() + 1, "Year cannot be in the future")
            .optional(),
    }),
});
exports.updateBusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Bus ID"),
    }),
    body: zod_1.z.object({
        busTypeId: zod_1.z
            .string()
            .uuid("Invalid Bus Type ID")
            .optional(),
        busNumber: zod_1.z
            .string()
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters")
            .optional(),
        plateNumber: zod_1.z
            .string()
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters")
            .optional(),
        model: zod_1.z
            .string()
            .max(100, "Model cannot exceed 100 characters")
            .optional()
            .nullable(),
        color: zod_1.z
            .string()
            .max(50, "Color cannot exceed 50 characters")
            .optional()
            .nullable(),
        year: zod_1.z
            .number()
            .int("Year must be an integer")
            .min(1900, "Year must be at least 1900")
            .max(new Date().getFullYear() + 1, "Year cannot be in the future")
            .optional()
            .nullable(),
        status: zod_1.z
            .enum(["active", "inactive", "maintenance"])
            .optional(),
    }),
});
exports.busIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Bus ID"),
    }),
});
