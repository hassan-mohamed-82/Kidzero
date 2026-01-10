"use strict";
// src/validators/subAdminValidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.subAdminIdSchema = exports.updateSubAdminSchema = exports.createSubAdminSchema = void 0;
const zod_1 = require("zod");
exports.createSubAdminSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").max(255),
        email: zod_1.z.string().email("Invalid email"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
        roleId: zod_1.z.string().uuid("Invalid role ID").optional(),
    }),
});
exports.updateSubAdminSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid SubAdmin ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        email: zod_1.z.string().email("Invalid email").optional(),
        password: zod_1.z.string().min(6).optional(),
        roleId: zod_1.z.string().uuid("Invalid role ID").nullable().optional(),
        status: zod_1.z.enum(["active", "inactive"]).optional(),
    }),
});
exports.subAdminIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid SubAdmin ID"),
    }),
});
