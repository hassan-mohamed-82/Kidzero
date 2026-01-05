// src/validators/roleSchema.ts

import { z } from "zod";
import { MODULES, ACTION_NAMES } from "../../types/constant";

const actionSchema = z.object({
    id: z.string().optional(),
    action: z.enum(ACTION_NAMES),
});

const permissionSchema = z.object({
    module: z.enum(MODULES),
    actions: z.array(actionSchema).min(1, "At least one action is required"),
});

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required"),
        permissions: z.array(permissionSchema).min(1, "At least one permission is required"),
    }),
});

export const updateRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required").optional(),
        permissions: z.array(permissionSchema).optional(),
        status: z.enum(["active", "inactive"]).optional(),
    }),
});

export const roleIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Role ID"),
    }),
});
