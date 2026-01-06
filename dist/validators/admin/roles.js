"use strict";
// src/validators/roleSchema.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleIdSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
const constant_1 = require("../../types/constant");
const actionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    action: zod_1.z.enum(constant_1.ACTION_NAMES),
});
const permissionSchema = zod_1.z.object({
    module: zod_1.z.enum(constant_1.MODULES),
    actions: zod_1.z.array(actionSchema).min(1, "At least one action is required"),
});
exports.createRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Role name is required"),
        permissions: zod_1.z.array(permissionSchema).min(1, "At least one permission is required"),
    }),
});
exports.updateRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Role name is required").optional(),
        permissions: zod_1.z.array(permissionSchema).optional(),
        status: zod_1.z.enum(["active", "inactive"]).optional(),
    }),
});
exports.roleIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Role ID"),
    }),
});
