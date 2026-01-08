"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
// Schema للـ Create
exports.createDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
});
// Schema للـ Update
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
});
