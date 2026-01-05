import { z } from "zod";
export declare const createComplaintSchema: z.ZodObject<{
    body: z.ZodObject<{
        categoryId: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        categoryId: string;
    }, {
        content: string;
        categoryId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        content: string;
        categoryId: string;
    };
}, {
    body: {
        content: string;
        categoryId: string;
    };
}>;
