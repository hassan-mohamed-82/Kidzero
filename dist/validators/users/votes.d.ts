import { z } from "zod";
export declare const submitVoteSchema: z.ZodObject<{
    body: z.ZodObject<{
        items: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        items: string[];
    }, {
        items: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        items: string[];
    };
}, {
    body: {
        items: string[];
    };
}>;
