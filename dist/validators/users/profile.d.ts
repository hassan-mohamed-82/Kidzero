import { z } from "zod";
export declare const updateUserProfileSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        purpose: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        imagePath?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
    }, {
        name?: string | undefined;
        imagePath?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        imagePath?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        imagePath?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
    };
}>;
