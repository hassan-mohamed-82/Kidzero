import { z } from "zod";
export declare const participateCompetitionSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        dateOfBirth: z.ZodEffects<z.ZodString, string, string>;
        gender: z.ZodEnum<["male", "female"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        dateOfBirth: string;
        gender: "male" | "female";
    }, {
        name: string;
        dateOfBirth: string;
        gender: "male" | "female";
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        dateOfBirth: string;
        gender: "male" | "female";
    };
}, {
    body: {
        name: string;
        dateOfBirth: string;
        gender: "male" | "female";
    };
}>;
