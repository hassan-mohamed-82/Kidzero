import { number } from "joi";
import z from "zod";

export const CreateMemberSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        photo: z.string().min(1),
        number: z.string().min(1),
        description: z.string().min(1),
        layer: z.number().min(1),
    }),
});

export const UpdateMemberSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        photo: z.string().min(1).optional(),
        number: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        layer: z.number().min(1).optional(),
    }),
});