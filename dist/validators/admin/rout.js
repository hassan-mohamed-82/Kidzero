"use strict";
// src/validators/routeValidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeIdSchema = exports.updateRouteSchema = exports.createRouteSchema = void 0;
const zod_1 = require("zod");
const pickupPointSchema = zod_1.z.object({
    pickupPointId: zod_1.z.string().uuid("Invalid Pickup Point ID"),
    stopOrder: zod_1.z.number().int().min(1, "Stop order must be at least 1"),
});
exports.createRouteSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: "Route name is required" })
            .min(1, "Route name cannot be empty")
            .max(255, "Route name cannot exceed 255 characters"),
        description: zod_1.z.string().optional().nullable(),
        pickupPoints: zod_1.z
            .array(pickupPointSchema)
            .min(1, "At least one pickup point is required"),
    }),
});
exports.updateRouteSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Route ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, "Route name cannot be empty")
            .max(255, "Route name cannot exceed 255 characters")
            .optional(),
        description: zod_1.z.string().optional().nullable(),
        pickupPoints: zod_1.z.array(pickupPointSchema).optional(),
        status: zod_1.z.enum(["active", "inactive"]).optional(),
    }),
});
exports.routeIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Route ID"),
    }),
});
