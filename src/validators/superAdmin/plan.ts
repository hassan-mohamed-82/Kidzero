import z from "zod";

export const createPlanSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        price_semester: z.number().min(0).optional(),
        price_year: z.number().min(0).optional(),
        max_buses: z.number().min(1, "Max buses must be at least 1"),
        max_drivers: z.number().min(1, "Max drivers must be at least 1"),
        max_students: z.number().min(1, "Max students must be at least 1"),
    }),
});


export const updatePlanSchema = z.object({
    params: z.object({
        Id: z.string().min(1, "Plan Id is required"),
    }),
    body: z.object({
        name: z.string().min(1, "Name is required").optional(),
        price_semester: z.number().min(0).optional(),
        price_year: z.number().min(0).optional(),
        max_buses: z.number().min(1, "Max buses must be at least 1").optional(),
        max_drivers: z.number().min(1, "Max drivers must be at least 1").optional(),
        max_students: z.number().min(1, "Max students must be at least 1").optional(),
    }),
});