import z from "zod";

export const createParentPlanSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Parent plan name is required"),
        price: z.number().min(1, "Parent plan price is required"),
        minSubscriptionfeesPay: z.number().min(1, "Parent plan minSubscriptionfeesPay is required"),
        subscriptionFees: z.number().min(1, "Parent plan subscriptionFees is required"),
    }),
});

export const updateParentPlanSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid parent plan ID format"),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        price: z.number().optional(),
        minSubscriptionfeesPay: z.number().optional(),
        subscriptionFees: z.number().optional(),
    }),
}); 