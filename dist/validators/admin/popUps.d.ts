import { z } from "zod";
export declare const createPopUpSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        imagePath: z.ZodString;
        startDate: z.ZodEffects<z.ZodString, string, string>;
        endDate: z.ZodEffects<z.ZodString, string, string>;
        status: z.ZodOptional<z.ZodEnum<["active", "disabled"]>>;
        pageIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        imagePath: string;
        startDate: string;
        endDate: string;
        title: string;
        pageIds: string[];
        status?: "active" | "disabled" | undefined;
    }, {
        imagePath: string;
        startDate: string;
        endDate: string;
        title: string;
        pageIds: string[];
        status?: "active" | "disabled" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        imagePath: string;
        startDate: string;
        endDate: string;
        title: string;
        pageIds: string[];
        status?: "active" | "disabled" | undefined;
    };
}, {
    body: {
        imagePath: string;
        startDate: string;
        endDate: string;
        title: string;
        pageIds: string[];
        status?: "active" | "disabled" | undefined;
    };
}>;
export declare const updatePopUpSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "disabled"]>>;
        pageIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        imagePath?: string | undefined;
        status?: "active" | "disabled" | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        title?: string | undefined;
        pageIds?: string[] | undefined;
    }, {
        imagePath?: string | undefined;
        status?: "active" | "disabled" | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        title?: string | undefined;
        pageIds?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        imagePath?: string | undefined;
        status?: "active" | "disabled" | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        title?: string | undefined;
        pageIds?: string[] | undefined;
    };
}, {
    body: {
        imagePath?: string | undefined;
        status?: "active" | "disabled" | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        title?: string | undefined;
        pageIds?: string[] | undefined;
    };
}>;
