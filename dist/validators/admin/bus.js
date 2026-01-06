// src/validators/busSchema.ts
import { z } from "zod";
export const createBusSchema = z.object({
    body: z.object({
        busTypeId: z
            .string({ required_error: "Bus Type ID is required" })
            .uuid("Invalid Bus Type ID"),
        busNumber: z
            .string({ required_error: "Bus Number is required" })
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters"),
        plateNumber: z
            .string({ required_error: "Plate Number is required" })
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters"),
        model: z
            .string()
            .max(100, "Model cannot exceed 100 characters")
            .optional(),
        color: z
            .string()
            .max(50, "Color cannot exceed 50 characters")
            .optional(),
        year: z
            .number()
            .int("Year must be an integer")
            .min(1900, "Year must be at least 1900")
            .max(new Date().getFullYear() + 1, "Year cannot be in the future")
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
        busNumber: z
            .string()
            .min(1, "Bus Number cannot be empty")
            .max(50, "Bus Number cannot exceed 50 characters")
            .optional(),
        plateNumber: z
            .string()
            .min(1, "Plate Number cannot be empty")
            .max(20, "Plate Number cannot exceed 20 characters")
            .optional(),
        model: z
            .string()
            .max(100, "Model cannot exceed 100 characters")
            .optional()
            .nullable(),
        color: z
            .string()
            .max(50, "Color cannot exceed 50 characters")
            .optional()
            .nullable(),
        year: z
            .number()
            .int("Year must be an integer")
            .min(1900, "Year must be at least 1900")
            .max(new Date().getFullYear() + 1, "Year cannot be in the future")
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
//# sourceMappingURL=bus.js.map