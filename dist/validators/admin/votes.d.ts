import { z } from "zod";
export declare const createFullVoteSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        maxSelections: z.ZodNumber;
        items: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        maxSelections: number;
        startDate: string;
        endDate: string;
        items?: string[] | undefined;
    }, {
        name: string;
        maxSelections: number;
        startDate: string;
        endDate: string;
        items?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        maxSelections: number;
        startDate: string;
        endDate: string;
        items?: string[] | undefined;
    };
}, {
    body: {
        name: string;
        maxSelections: number;
        startDate: string;
        endDate: string;
        items?: string[] | undefined;
    };
}>;
export declare const updateVoteSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        maxSelections: z.ZodOptional<z.ZodNumber>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        items: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        maxSelections?: number | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        items?: any[] | undefined;
    }, {
        name?: string | undefined;
        maxSelections?: number | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        items?: any[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        maxSelections?: number | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        items?: any[] | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        maxSelections?: number | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        items?: any[] | undefined;
    };
}>;
