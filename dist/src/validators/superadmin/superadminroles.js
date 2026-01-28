"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const permissionsSchema = zod_1.default.union([
    zod_1.default.string(),
    zod_1.default.array(zod_1.default.any())
]);
exports.createRoleSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Role name is required"),
        permissions: permissionsSchema.optional(),
    }),
});
exports.updateRoleSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string().uuid("Invalid role ID format"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).optional(),
        status: zod_1.default.enum(["active", "inactive"]).optional(),
        permissions: permissionsSchema.optional(),
    }),
});
