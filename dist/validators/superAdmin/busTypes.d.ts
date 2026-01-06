import z from "zod";
export declare const createBusTypeSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        capacity: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        capacity: number;
        description?: string | undefined;
    }, {
        name: string;
        capacity: number;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        capacity: number;
        description?: string | undefined;
    };
}, {
    body: {
        name: string;
        capacity: number;
        description?: string | undefined;
    };
}>;
export declare const updateBusTypeSchema: z.ZodObject<{
    params: z.ZodObject<{
        Id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        Id: string;
    }, {
        Id: string;
    }>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        capacity: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        description?: string | undefined;
        status?: "active" | "inactive" | undefined;
        capacity?: number | undefined;
    }, {
        name?: string | undefined;
        description?: string | undefined;
        status?: "active" | "inactive" | undefined;
        capacity?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        Id: string;
    };
    body: {
        name?: string | undefined;
        description?: string | undefined;
        status?: "active" | "inactive" | undefined;
        capacity?: number | undefined;
    };
}, {
    params: {
        Id: string;
    };
    body: {
        name?: string | undefined;
        description?: string | undefined;
        status?: "active" | "inactive" | undefined;
        capacity?: number | undefined;
    };
}>;
