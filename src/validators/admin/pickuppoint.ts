// src/validators/pickupPointSchema.ts

import { z } from "zod";

// Schema للـ Create
export const createPickupPointSchema = z.object({
    body: z.object({
       
        name: z
            .string({ required_error: "Name is required" })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        
        address: z
            .string()
            .max(1000, "Address cannot exceed 1000 characters")
            .optional()
            .nullable(),
        
        lat: z
            .string({ required_error: "Latitude is required" })
            .regex(/^-?([1-8]?[0-9]\.{1}\d+|90\.{1}0+)$/, "Invalid latitude format")
            .or(z.number().min(-90).max(90).transform(String)),
        
        lng: z
            .string({ required_error: "Longitude is required" })
            .regex(/^-?((1[0-7][0-9]|[1-9]?[0-9])\.{1}\d+|180\.{1}0+)$/, "Invalid longitude format")
            .or(z.number().min(-180).max(180).transform(String)),
    }),
});

// Schema للـ Update
export const updatePickupPointSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Pickup Point ID"),
    }),
    body: z.object({
        name: z
            .string()
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters")
            .optional(),
        
        address: z
            .string()
            .max(1000, "Address cannot exceed 1000 characters")
            .optional()
            .nullable(),
        
        lat: z
            .string()
            .regex(/^-?([1-8]?[0-9]\.{1}\d+|90\.{1}0+)$/, "Invalid latitude format")
            .optional()
            .or(z.number().min(-90).max(90).transform(String).optional()),
        
        lng: z
            .string()
            .regex(/^-?((1[0-7][0-9]|[1-9]?[0-9])\.{1}\d+|180\.{1}0+)$/, "Invalid longitude format")
            .optional()
            .or(z.number().min(-180).max(180).transform(String).optional()),
        
        status: z
            .enum(["active", "inactive"], {
                errorMap: () => ({ message: "Status must be 'active' or 'inactive'" })
            })
            .optional(),
    }),
});

// Schema للـ ID في Params
export const pickupPointIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Pickup Point ID"),
    }),
});

// Types
export type CreatePickupPointInput = z.infer<typeof createPickupPointSchema>["body"];
export type UpdatePickupPointInput = z.infer<typeof updatePickupPointSchema>["body"];
