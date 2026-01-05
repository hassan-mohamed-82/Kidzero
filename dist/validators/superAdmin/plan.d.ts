import z from "zod";
export declare const createPlanSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        price_semester: z.ZodOptional<z.ZodNumber>;
        price_year: z.ZodOptional<z.ZodNumber>;
        max_buses: z.ZodNumber;
        max_drivers: z.ZodNumber;
        max_students: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        max_buses: number;
        max_drivers: number;
        max_students: number;
        price_semester?: number | undefined;
        price_year?: number | undefined;
    }, {
        name: string;
        max_buses: number;
        max_drivers: number;
        max_students: number;
        price_semester?: number | undefined;
        price_year?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        max_buses: number;
        max_drivers: number;
        max_students: number;
        price_semester?: number | undefined;
        price_year?: number | undefined;
    };
}, {
    body: {
        name: string;
        max_buses: number;
        max_drivers: number;
        max_students: number;
        price_semester?: number | undefined;
        price_year?: number | undefined;
    };
}>;
export declare const updatePlanSchema: z.ZodObject<{
    params: z.ZodObject<{
        Id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        Id: string;
    }, {
        Id: string;
    }>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        price_semester: z.ZodOptional<z.ZodNumber>;
        price_year: z.ZodOptional<z.ZodNumber>;
        max_buses: z.ZodOptional<z.ZodNumber>;
        max_drivers: z.ZodOptional<z.ZodNumber>;
        max_students: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        price_semester?: number | undefined;
        price_year?: number | undefined;
        max_buses?: number | undefined;
        max_drivers?: number | undefined;
        max_students?: number | undefined;
    }, {
        name?: string | undefined;
        price_semester?: number | undefined;
        price_year?: number | undefined;
        max_buses?: number | undefined;
        max_drivers?: number | undefined;
        max_students?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        Id: string;
    };
    body: {
        name?: string | undefined;
        price_semester?: number | undefined;
        price_year?: number | undefined;
        max_buses?: number | undefined;
        max_drivers?: number | undefined;
        max_students?: number | undefined;
    };
}, {
    params: {
        Id: string;
    };
    body: {
        name?: string | undefined;
        price_semester?: number | undefined;
        price_year?: number | undefined;
        max_buses?: number | undefined;
        max_drivers?: number | undefined;
        max_students?: number | undefined;
    };
}>;
