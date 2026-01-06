import { z } from "zod";
export declare const createBusSchema: z.ZodObject<{
    body: z.ZodObject<{
        busTypeId: z.ZodString;
        busNumber: z.ZodString;
        plateNumber: z.ZodString;
        model: z.ZodOptional<z.ZodString>;
        color: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        busTypeId: string;
        busNumber: string;
        plateNumber: string;
        model?: string | undefined;
        color?: string | undefined;
        year?: number | undefined;
    }, {
        busTypeId: string;
        busNumber: string;
        plateNumber: string;
        model?: string | undefined;
        color?: string | undefined;
        year?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        busTypeId: string;
        busNumber: string;
        plateNumber: string;
        model?: string | undefined;
        color?: string | undefined;
        year?: number | undefined;
    };
}, {
    body: {
        busTypeId: string;
        busNumber: string;
        plateNumber: string;
        model?: string | undefined;
        color?: string | undefined;
        year?: number | undefined;
    };
}>;
export declare const updateBusSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        busTypeId: z.ZodOptional<z.ZodString>;
        busNumber: z.ZodOptional<z.ZodString>;
        plateNumber: z.ZodOptional<z.ZodString>;
        model: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        color: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        year: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "maintenance"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "maintenance" | undefined;
        busTypeId?: string | undefined;
        busNumber?: string | undefined;
        plateNumber?: string | undefined;
        model?: string | null | undefined;
        color?: string | null | undefined;
        year?: number | null | undefined;
    }, {
        status?: "active" | "inactive" | "maintenance" | undefined;
        busTypeId?: string | undefined;
        busNumber?: string | undefined;
        plateNumber?: string | undefined;
        model?: string | null | undefined;
        color?: string | null | undefined;
        year?: number | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        status?: "active" | "inactive" | "maintenance" | undefined;
        busTypeId?: string | undefined;
        busNumber?: string | undefined;
        plateNumber?: string | undefined;
        model?: string | null | undefined;
        color?: string | null | undefined;
        year?: number | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "active" | "inactive" | "maintenance" | undefined;
        busTypeId?: string | undefined;
        busNumber?: string | undefined;
        plateNumber?: string | undefined;
        model?: string | null | undefined;
        color?: string | null | undefined;
        year?: number | null | undefined;
    };
}>;
export declare const busIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
