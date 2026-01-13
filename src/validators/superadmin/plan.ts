import z from "zod";


export const createPlanSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        price: z.number().min(0).default(0),
        max_buses: z.number().int().min(1, "Max buses must be at least 1").default(10),
        max_drivers: z.number().int().min(1, "Max drivers must be at least 1").default(20),
        max_students: z.number().int().min(1, "Max students must be at least 1").default(100),
        min_subscription_fees_pay: z.number().min(0).default(0),
        subscription_fees: z.number().min(0).default(0),
    }),
});

export const updatePlanSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid plan ID format"),
    }),
    body: z.object({
        name: z.string().min(1, "Name is required").optional(),
        price: z.number().min(0).optional(),
        maxBuses: z.number().int().min(1, "Max buses must be at least 1").optional(),
        maxDrivers: z.number().int().min(1, "Max drivers must be at least 1").optional(),
        maxStudents: z.number().int().min(1, "Max students must be at least 1").optional(),
        minSubscriptionFeesPay: z.number().min(0).optional(),
        subscriptionFees: z.number().min(0).optional(),
    }),
});