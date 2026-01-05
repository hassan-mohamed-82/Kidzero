import {z} from "zod";

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required"),
        permissions: z.array(
            z.object({
                action: z.string(),
                resource: z.string(),
            })
        ),
    }),
})

export const updateRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required").optional(),
        permissions: z.array(
            z.object({
                action: z.string(),
                resource: z.string(),
            })
        ).optional(),
        status: z.enum(["active", "inactive"]).optional(),
    }),
});