import { z } from "zod";
export declare const createAdminSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        roleId: z.ZodOptional<z.ZodString>;
        type: z.ZodDefault<z.ZodEnum<["organizer", "admin"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        password: string;
        type: "organizer" | "admin";
        roleId?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
    }, {
        name: string;
        email: string;
        password: string;
        roleId?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
        type?: "organizer" | "admin" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        email: string;
        password: string;
        type: "organizer" | "admin";
        roleId?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
    };
}, {
    body: {
        name: string;
        email: string;
        password: string;
        roleId?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
        type?: "organizer" | "admin" | undefined;
    };
}>;
export declare const updateAdminSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        avatar: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        roleId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        type: z.ZodOptional<z.ZodEnum<["organizer", "admin"]>>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        email?: string | undefined;
        status?: "active" | "inactive" | undefined;
        roleId?: string | null | undefined;
        password?: string | undefined;
        phone?: string | null | undefined;
        avatar?: string | null | undefined;
        type?: "organizer" | "admin" | undefined;
    }, {
        name?: string | undefined;
        email?: string | undefined;
        status?: "active" | "inactive" | undefined;
        roleId?: string | null | undefined;
        password?: string | undefined;
        phone?: string | null | undefined;
        avatar?: string | null | undefined;
        type?: "organizer" | "admin" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        email?: string | undefined;
        status?: "active" | "inactive" | undefined;
        roleId?: string | null | undefined;
        password?: string | undefined;
        phone?: string | null | undefined;
        avatar?: string | null | undefined;
        type?: "organizer" | "admin" | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        email?: string | undefined;
        status?: "active" | "inactive" | undefined;
        roleId?: string | null | undefined;
        password?: string | undefined;
        phone?: string | null | undefined;
        avatar?: string | null | undefined;
        type?: "organizer" | "admin" | undefined;
    };
}>;
export declare const adminIdSchema: z.ZodObject<{
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
