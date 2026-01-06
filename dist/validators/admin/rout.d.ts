import { z } from "zod";
export declare const createRouteSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        pickupPoints: z.ZodArray<z.ZodObject<{
            pickupPointId: z.ZodString;
            stopOrder: z.ZodNumber;
            estimatedArrival: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }, {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        pickupPoints: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[];
        description?: string | null | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    }, {
        name: string;
        pickupPoints: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[];
        description?: string | null | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        pickupPoints: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[];
        description?: string | null | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    };
}, {
    body: {
        name: string;
        pickupPoints: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[];
        description?: string | null | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    };
}>;
export declare const updateRouteSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        startTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        endTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        pickupPoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
            pickupPointId: z.ZodString;
            stopOrder: z.ZodNumber;
            estimatedArrival: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }, {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }>, "many">>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        description?: string | null | undefined;
        status?: "active" | "inactive" | undefined;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        pickupPoints?: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[] | undefined;
    }, {
        name?: string | undefined;
        description?: string | null | undefined;
        status?: "active" | "inactive" | undefined;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        pickupPoints?: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        description?: string | null | undefined;
        status?: "active" | "inactive" | undefined;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        pickupPoints?: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[] | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        description?: string | null | undefined;
        status?: "active" | "inactive" | undefined;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        pickupPoints?: {
            pickupPointId: string;
            stopOrder: number;
            estimatedArrival?: string | undefined;
        }[] | undefined;
    };
}>;
export declare const routeIdSchema: z.ZodObject<{
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
