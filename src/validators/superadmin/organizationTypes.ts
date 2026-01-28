import z from "zod";

export const createOrganizationTypeSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Organization type name is required"),
    }),
});

export const updateOrganizationTypeSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid organization type ID format"),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
    }),
});