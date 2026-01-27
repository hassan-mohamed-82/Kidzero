import z from "zod";

export const createPaymentMethodSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Payment method name is required"),
        description: z.string().min(1, "Payment method description is required"),
        logo: z.string().min(1, "Payment method logo is required"),
        is_active: z.boolean().optional(),
        fee_status: z.boolean().optional(),
        fee_amount: z.number().optional(),
    }),
});

export const updatePaymentMethodSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        logo: z.string().min(1).optional(),
        is_active: z.boolean().optional(),
        fee_status: z.boolean().optional(),
        fee_amount: z.number().optional(),
    }),
});