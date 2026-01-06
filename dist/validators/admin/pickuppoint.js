"use strict";
// src/validators/pickupPointSchema.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickupPointIdSchema = exports.updatePickupPointSchema = exports.createPickupPointSchema = void 0;
const zod_1 = require("zod");
// Schema للـ Create
exports.createPickupPointSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: "Name is required" })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        address: zod_1.z
            .string()
            .max(1000, "Address cannot exceed 1000 characters")
            .optional()
            .nullable(),
        lat: zod_1.z
            .string({ required_error: "Latitude is required" })
            .regex(/^-?([1-8]?[0-9]\.{1}\d+|90\.{1}0+)$/, "Invalid latitude format")
            .or(zod_1.z.number().min(-90).max(90).transform(String)),
        lng: zod_1.z
            .string({ required_error: "Longitude is required" })
            .regex(/^-?((1[0-7][0-9]|[1-9]?[0-9])\.{1}\d+|180\.{1}0+)$/, "Invalid longitude format")
            .or(zod_1.z.number().min(-180).max(180).transform(String)),
    }),
});
// Schema للـ Update
exports.updatePickupPointSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Pickup Point ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters")
            .optional(),
        address: zod_1.z
            .string()
            .max(1000, "Address cannot exceed 1000 characters")
            .optional()
            .nullable(),
        lat: zod_1.z
            .string()
            .regex(/^-?([1-8]?[0-9]\.{1}\d+|90\.{1}0+)$/, "Invalid latitude format")
            .optional()
            .or(zod_1.z.number().min(-90).max(90).transform(String).optional()),
        lng: zod_1.z
            .string()
            .regex(/^-?((1[0-7][0-9]|[1-9]?[0-9])\.{1}\d+|180\.{1}0+)$/, "Invalid longitude format")
            .optional()
            .or(zod_1.z.number().min(-180).max(180).transform(String).optional()),
        status: zod_1.z
            .enum(["active", "inactive"], {
            errorMap: () => ({ message: "Status must be 'active' or 'inactive'" })
        })
            .optional(),
    }),
});
// Schema للـ ID في Params
exports.pickupPointIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Pickup Point ID"),
    }),
});
