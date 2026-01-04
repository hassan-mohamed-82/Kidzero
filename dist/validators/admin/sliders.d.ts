import { z } from "zod";
export declare const createSliderSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        status: z.ZodOptional<z.ZodEnum<["active", "disabled"]>>;
        order: z.ZodNumber;
        images: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        images: string[];
        status?: "active" | "disabled" | undefined;
    }, {
        name: string;
        order: number;
        images: string[];
        status?: "active" | "disabled" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        order: number;
        images: string[];
        status?: "active" | "disabled" | undefined;
    };
}, {
    body: {
        name: string;
        order: number;
        images: string[];
        status?: "active" | "disabled" | undefined;
    };
}>;
export declare const updateSliderSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "disabled"]>>;
        order: z.ZodOptional<z.ZodNumber>;
        images: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        status?: "active" | "disabled" | undefined;
        order?: number | undefined;
        images?: any[] | undefined;
    }, {
        name?: string | undefined;
        status?: "active" | "disabled" | undefined;
        order?: number | undefined;
        images?: any[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        status?: "active" | "disabled" | undefined;
        order?: number | undefined;
        images?: any[] | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        status?: "active" | "disabled" | undefined;
        order?: number | undefined;
        images?: any[] | undefined;
    };
}>;
export declare const changeStatus: z.ZodObject<{
    body: z.ZodObject<{
        status: z.ZodEnum<["active", "disabled"]>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "disabled";
    }, {
        status: "active" | "disabled";
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "active" | "disabled";
    };
}, {
    body: {
        status: "active" | "disabled";
    };
}>;
