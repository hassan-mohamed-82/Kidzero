import { z } from "zod";
export declare const createRoleSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        permissions: z.ZodArray<z.ZodObject<{
            action: z.ZodString;
            resource: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            action: string;
            resource: string;
        }, {
            action: string;
            resource: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        permissions: {
            action: string;
            resource: string;
        }[];
    }, {
        name: string;
        permissions: {
            action: string;
            resource: string;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        permissions: {
            action: string;
            resource: string;
        }[];
    };
}, {
    body: {
        name: string;
        permissions: {
            action: string;
            resource: string;
        }[];
    };
}>;
export declare const updateRoleSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        permissions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            action: z.ZodString;
            resource: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            action: string;
            resource: string;
        }, {
            action: string;
            resource: string;
        }>, "many">>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            action: string;
            resource: string;
        }[] | undefined;
    }, {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            action: string;
            resource: string;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            action: string;
            resource: string;
        }[] | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            action: string;
            resource: string;
        }[] | undefined;
    };
}>;
