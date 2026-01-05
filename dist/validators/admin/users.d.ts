import { z } from "zod";
export declare const updateUserSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        name: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
        email: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
        phoneNumber: z.ZodOptional<z.ZodString>;
        role: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
        password: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
        imageBase64: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        role?: string | undefined;
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        imageBase64?: string | undefined;
    }, {
        name?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        role?: string | undefined;
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        imageBase64?: string | undefined;
    }>, {
        name?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        role?: string | undefined;
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        imageBase64?: string | undefined;
    }, {
        name?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        role?: string | undefined;
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        imageBase64?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        role?: string | undefined;
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        imageBase64?: string | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        role?: string | undefined;
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        imageBase64?: string | undefined;
    };
}>;
