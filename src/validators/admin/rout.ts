import { z } from "zod";

const pickupPointSchema = z.object({
    pickupPointId: z.string().uuid("Invalid Pickup Point ID"),
    stopOrder: z.number().int().min(1, "Stop order must be at least 1"),
    estimatedArrival: z.string().optional(), // "08:30:00"
});

export const createRouteSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Route name is required" })
            .min(1, "Route name cannot be empty")
            .max(255, "Route name cannot exceed 255 characters"),
        description: z
            .string()
            .optional()
            .nullable(),
        startTime: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (HH:MM or HH:MM:SS)")
            .optional(),
        endTime: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (HH:MM or HH:MM:SS)")
            .optional(),
        pickupPoints: z
            .array(pickupPointSchema)
            .min(1, "At least one pickup point is required"),
    }),
});

export const updateRouteSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Route ID"),
    }),
    body: z.object({
        name: z
            .string()
            .min(1, "Route name cannot be empty")
            .max(255, "Route name cannot exceed 255 characters")
            .optional(),
        description: z
            .string()
            .optional()
            .nullable(),
        startTime: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format")
            .optional()
            .nullable(),
        endTime: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format")
            .optional()
            .nullable(),
        pickupPoints: z
            .array(pickupPointSchema)
            .optional(),
        status: z
            .enum(["active", "inactive"])
            .optional(),
    }),
});

export const routeIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Route ID"),
    }),
});