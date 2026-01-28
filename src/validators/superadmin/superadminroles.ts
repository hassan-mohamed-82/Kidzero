import z from "zod";

const permissionsSchema = z.union([
    z.string(),
    z.array(z.any())
]);

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required"),
        permissions: permissionsSchema.optional(),
    }),
});

export const updateRoleSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid role ID format"),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        status: z.enum(["active", "inactive"]).optional(),
        permissions: permissionsSchema.optional(),
    }),
});
