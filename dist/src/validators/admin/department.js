"use strict";
// src/validators/departmentValidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentIdSchema = exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
// Schema للـ Create
exports.createDepartmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(100),
    }),
});
// Schema للـ Update
exports.updateDepartmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid department ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100).optional(),
    }),
});
// Schema للـ ID
exports.departmentIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid department ID"),
    }),
});
