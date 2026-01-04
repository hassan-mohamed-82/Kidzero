import { z } from "zod";
export declare const createComplaintSchema: z.ZodObject<{
    body: z.ZodObject<{
        categoryId: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        categoryId: string;
        content: string;
    }, {
        categoryId: string;
        content: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        categoryId: string;
        content: string;
    };
}, {
    body: {
        categoryId: string;
        content: string;
    };
}>;
