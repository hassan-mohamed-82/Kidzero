import { z } from "zod";
export declare const updateProfileSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        phoneNumber: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        phoneNumber?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
    }, {
        name?: string | undefined;
        phoneNumber?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        phoneNumber?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        phoneNumber?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
    };
}>;
