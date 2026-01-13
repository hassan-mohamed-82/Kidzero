"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCitySchema = exports.createCitySchema = void 0;
const zod_1 = require("zod");
exports.createCitySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "City name is required").max(100, "City name is too long"),
    }),
});
exports.updateCitySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid city ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "City name is required").max(100, "City name is too long").optional(),
    }),
});
