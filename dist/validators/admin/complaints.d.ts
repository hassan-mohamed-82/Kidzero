import { z } from "zod";
export declare const createCategorySchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
    }, {
        name: string;
        description: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        description: string;
    };
}, {
    body: {
        name: string;
        description: string;
    };
}>;
export declare const updateCategorySchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        description?: string | undefined;
    }, {
        name?: string | undefined;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        description?: string | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        description?: string | undefined;
    };
}>;
