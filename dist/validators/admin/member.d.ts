import z from "zod";
export declare const CreateMemberSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        photo: z.ZodString;
        number: z.ZodString;
        description: z.ZodString;
        layer: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        number: string;
        name: string;
        description: string;
        photo: string;
        layer: number;
    }, {
        number: string;
        name: string;
        description: string;
        photo: string;
        layer: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        number: string;
        name: string;
        description: string;
        photo: string;
        layer: number;
    };
}, {
    body: {
        number: string;
        name: string;
        description: string;
        photo: string;
        layer: number;
    };
}>;
export declare const UpdateMemberSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        photo: z.ZodOptional<z.ZodString>;
        number: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        layer: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        number?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        photo?: string | undefined;
        layer?: number | undefined;
    }, {
        number?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        photo?: string | undefined;
        layer?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        number?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        photo?: string | undefined;
        layer?: number | undefined;
    };
}, {
    body: {
        number?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        photo?: string | undefined;
        layer?: number | undefined;
    };
}>;
