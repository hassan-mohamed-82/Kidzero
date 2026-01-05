import { z } from "zod";
export declare const createPickupPointSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        lat: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodNumber, string, number>]>;
        lng: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodNumber, string, number>]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        lat: string;
        lng: string;
        address?: string | null | undefined;
    }, {
        name: string;
        lat: string | number;
        lng: string | number;
        address?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        lat: string;
        lng: string;
        address?: string | null | undefined;
    };
}, {
    body: {
        name: string;
        lat: string | number;
        lng: string | number;
        address?: string | null | undefined;
    };
}>;
export declare const updatePickupPointSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        lat: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodEffects<z.ZodNumber, string, number>>]>;
        lng: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodEffects<z.ZodNumber, string, number>>]>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        address?: string | null | undefined;
        lat?: string | undefined;
        lng?: string | undefined;
    }, {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        address?: string | null | undefined;
        lat?: string | number | undefined;
        lng?: string | number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        address?: string | null | undefined;
        lat?: string | undefined;
        lng?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        address?: string | null | undefined;
        lat?: string | number | undefined;
        lng?: string | number | undefined;
    };
}>;
export declare const pickupPointIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export type CreatePickupPointInput = z.infer<typeof createPickupPointSchema>["body"];
export type UpdatePickupPointInput = z.infer<typeof updatePickupPointSchema>["body"];
