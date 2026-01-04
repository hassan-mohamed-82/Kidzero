import { z } from "zod";
export declare const createNotificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        body: string;
    }, {
        title: string;
        body: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        title: string;
        body: string;
    };
}, {
    body: {
        title: string;
        body: string;
    };
}>;
export declare const updateNotificationSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        body?: string | undefined;
    }, {
        title?: string | undefined;
        body?: string | undefined;
    }>, {
        title?: string | undefined;
        body?: string | undefined;
    }, {
        title?: string | undefined;
        body?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        title?: string | undefined;
        body?: string | undefined;
    };
}, {
    body: {
        title?: string | undefined;
        body?: string | undefined;
    };
}>;
