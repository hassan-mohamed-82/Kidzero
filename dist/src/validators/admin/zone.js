"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateZoneSchema = exports.createZoneSchema = void 0;
const zod_1 = require("zod");
exports.createZoneSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Zone name is required").max(100, "Zone name is too long"),
        cityId: zod_1.z.string().uuid("Invalid city ID"),
        cost: zod_1.z.number().min(0, "Cost must be at least 0"),
    }),
});
exports.updateZoneSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid zone ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Zone name is required").max(100, "Zone name is too long").optional(),
        cityId: zod_1.z.string().uuid("Invalid city ID").optional(),
        cost: zod_1.z.number().min(0, "Cost must be at least 0").optional(),
    }),
});
