"use strict";
// src/validators/busSchema.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.busIdSchema = exports.updateBusSchema = exports.createBusSchema = void 0;
const zod_1 = require("zod");
exports.createBusSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Bus Type - نوع الباص (من القائمة)
        busTypeId: zod_1.z
            .string({ required_error: "Bus Type ID is required" })
            .uuid("Invalid Bus Type ID"),
        // Plate number - رقم اللوحة
        plateNumber: zod_1.z
            .string({ required_error: "Plate Number is required" })
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters"),
        // Bus number - رقم الباص
        busNumber: zod_1.z
            .string({ required_error: "Bus Number is required" })
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters"),
        // Max number of seats - عدد المقاعد
        maxSeats: zod_1.z
            .number({ required_error: "Max seats is required" })
            .int("Max seats must be an integer")
            .min(1, "Max seats must be at least 1")
            .max(100, "Max seats cannot exceed 100"),
        // License number - رقم الرخصة
        licenseNumber: zod_1.z
            .string()
            .max(50, "License Number cannot exceed 50 characters")
            .optional(),
        // License end date - تاريخ انتهاء الرخصة
        licenseExpiryDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
            .optional(),
        // Upload license photo - صورة الرخصة
        licenseImage: zod_1.z
            .string()
            .url("License image must be a valid URL")
            .optional(),
        // Upload Bus photo - صورة الباص
        busImage: zod_1.z
            .string()
            .url("Bus image must be a valid URL")
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
        plateNumber: zod_1.z
            .string()
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters")
            .optional(),
        busNumber: zod_1.z
            .string()
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters")
            .optional(),
        maxSeats: zod_1.z
            .number()
            .int("Max seats must be an integer")
            .min(1, "Max seats must be at least 1")
            .max(100, "Max seats cannot exceed 100")
            .optional(),
        licenseNumber: zod_1.z
            .string()
            .max(50, "License Number cannot exceed 50 characters")
            .optional()
            .nullable(),
        licenseExpiryDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
            .optional()
            .nullable(),
        licenseImage: zod_1.z
            .string()
            .url("License image must be a valid URL")
            .optional()
            .nullable(),
        busImage: zod_1.z
            .string()
            .url("Bus image must be a valid URL")
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
