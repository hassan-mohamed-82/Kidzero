import z from "zod";
export declare const createPromoCodeSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        code: z.ZodString;
        amount: z.ZodNumber;
        promocode_type: z.ZodEnum<["percentage", "amount"]>;
        description: z.ZodString;
        start_date: z.ZodEffects<z.ZodString, string, string>;
        end_date: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        code: string;
        amount: number;
        promocode_type: "amount" | "percentage";
        description: string;
        start_date: string;
        end_date: string;
    }, {
        name: string;
        code: string;
        amount: number;
        promocode_type: "amount" | "percentage";
        description: string;
        start_date: string;
        end_date: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        code: string;
        amount: number;
        promocode_type: "amount" | "percentage";
        description: string;
        start_date: string;
        end_date: string;
    };
}, {
    body: {
        name: string;
        code: string;
        amount: number;
        promocode_type: "amount" | "percentage";
        description: string;
        start_date: string;
        end_date: string;
    };
}>;
export declare const updatePromoCodeSchema: z.ZodObject<{
    params: z.ZodObject<{
        Id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        Id: string;
    }, {
        Id: string;
    }>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        code: z.ZodOptional<z.ZodString>;
        amount: z.ZodOptional<z.ZodNumber>;
        promocode_type: z.ZodOptional<z.ZodEnum<["percentage", "amount"]>>;
        description: z.ZodOptional<z.ZodString>;
        start_date: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        end_date: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        code?: string | undefined;
        amount?: number | undefined;
        promocode_type?: "amount" | "percentage" | undefined;
        description?: string | undefined;
        start_date?: string | undefined;
        end_date?: string | undefined;
    }, {
        name?: string | undefined;
        code?: string | undefined;
        amount?: number | undefined;
        promocode_type?: "amount" | "percentage" | undefined;
        description?: string | undefined;
        start_date?: string | undefined;
        end_date?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        Id: string;
    };
    body: {
        name?: string | undefined;
        code?: string | undefined;
        amount?: number | undefined;
        promocode_type?: "amount" | "percentage" | undefined;
        description?: string | undefined;
        start_date?: string | undefined;
        end_date?: string | undefined;
    };
}, {
    params: {
        Id: string;
    };
    body: {
        name?: string | undefined;
        code?: string | undefined;
        amount?: number | undefined;
        promocode_type?: "amount" | "percentage" | undefined;
        description?: string | undefined;
        start_date?: string | undefined;
        end_date?: string | undefined;
    };
}>;
