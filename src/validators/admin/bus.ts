// src/validators/busSchema.ts

import { z } from "zod";

export const createBusSchema = z.object({
    body: z.object({
        // Bus Type - نوع الباص (من القائمة)
        busTypeId: z
            .string({ required_error: "Bus Type ID is required" })
            .uuid("Invalid Bus Type ID"),

        // Plate number - رقم اللوحة
        plateNumber: z
            .string({ required_error: "Plate Number is required" })
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters"),

        // Bus number - رقم الباص
        busNumber: z
            .string({ required_error: "Bus Number is required" })
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters"),

        // Max number of seats - عدد المقاعد
        maxSeats: z
            .number({ required_error: "Max seats is required" })
            .int("Max seats must be an integer")
            .min(1, "Max seats must be at least 1")
            .max(100, "Max seats cannot exceed 100"),

        // License number - رقم الرخصة
        licenseNumber: z
            .string()
            .max(50, "License Number cannot exceed 50 characters")
            .optional(),

        // License end date - تاريخ انتهاء الرخصة
        licenseExpiryDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
            .optional(),

        // Upload license photo - صورة الرخصة
        licenseImage: z
            .string()
            .url("License image must be a valid URL")
            .optional(),

        // Upload Bus photo - صورة الباص
        busImage: z
            .string()
            .url("Bus image must be a valid URL")
            .optional(),
    }),
});

export const updateBusSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Bus ID"),
    }),
    body: z.object({
        busTypeId: z
            .string()
            .uuid("Invalid Bus Type ID")
            .optional(),

        plateNumber: z
            .string()
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters")
            .optional(),

        busNumber: z
            .string()
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters")
            .optional(),

        maxSeats: z
            .number()
            .int("Max seats must be an integer")
            .min(1, "Max seats must be at least 1")
            .max(100, "Max seats cannot exceed 100")
            .optional(),

        licenseNumber: z
            .string()
            .max(50, "License Number cannot exceed 50 characters")
            .optional()
            .nullable(),

        licenseExpiryDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
            .optional()
            .nullable(),

        licenseImage: z
            .string()
            .url("License image must be a valid URL")
            .optional()
            .nullable(),

        busImage: z
            .string()
            .url("Bus image must be a valid URL")
            .optional()
            .nullable(),

        status: z
            .enum(["active", "inactive", "maintenance"])
            .optional(),
    }),
});

export const busIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Bus ID"),
    }),
});
