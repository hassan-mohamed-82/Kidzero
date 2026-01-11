import { param } from "drizzle-orm";
import z from "zod";

export const createPromoCodeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    code: z.string().min(1, "Code is required").max(50, "Code is too long"),
    amount: z.number().min(0, "Amount must be a positive number"),
    promocode_type: z.enum(["percentage", "amount"], {
      errorMap: () => ({ message: "Invalid promocode type" }),
    }),
    description: z.string().min(1, "Description is required"),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date",
    }),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date",
    }),
  }),
});


export const updatePromoCodeSchema = z.object({
    params: z.object({
        Id: z.string().uuid("Invalid Promo Code Id"),
    }), 
  body: z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    code: z.string().min(1, "Code is required").max(50, "Code is too long").optional(),
    amount: z.number().min(0, "Amount must be a positive number").optional(),
    promocode_type: z.enum(["percentage", "amount"], {
        errorMap: () => ({ message: "Invalid promocode type" }),
        }).optional(),
    description: z.string().min(1, "Description is required").optional(),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date",
    }).optional(),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date",
    }).optional(),
  }),
});