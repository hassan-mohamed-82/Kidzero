"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateUserProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(255).optional(),
        purpose: zod_1.z.string().max(1000).optional(),
        imagePath: zod_1.z.string().optional(), // base64 or path
        dateOfBirth: zod_1.z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid date format",
        })
            .optional(),
    }),
});
