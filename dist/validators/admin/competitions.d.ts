import { z } from "zod";
export declare const createCompetitionSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        mainImagepath: z.ZodEffects<z.ZodString, string, string>;
        startDate: z.ZodEffects<z.ZodString, string, string>;
        endDate: z.ZodEffects<z.ZodString, string, string>;
        images: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        startDate: string;
        endDate: string;
        description: string;
        mainImagepath: string;
        images?: string[] | undefined;
    }, {
        name: string;
        startDate: string;
        endDate: string;
        description: string;
        mainImagepath: string;
        images?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        startDate: string;
        endDate: string;
        description: string;
        mainImagepath: string;
        images?: string[] | undefined;
    };
}, {
    body: {
        name: string;
        startDate: string;
        endDate: string;
        description: string;
        mainImagepath: string;
        images?: string[] | undefined;
    };
}>;
export declare const updateCompetitionSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        mainImagepath: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        endDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        images: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        mainImagepath?: string | undefined;
        images?: any[] | undefined;
    }, {
        name?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        mainImagepath?: string | undefined;
        images?: any[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        mainImagepath?: string | undefined;
        images?: any[] | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        mainImagepath?: string | undefined;
        images?: any[] | undefined;
    };
}>;
export declare const removeUserSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        userId: string;
    }, {
        id: string;
        userId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
        userId: string;
    };
}, {
    params: {
        id: string;
        userId: string;
    };
}>;
