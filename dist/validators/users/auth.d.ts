import { z } from "zod";
export declare const signupSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        name: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<["member", "guest"]>;
        email: z.ZodString;
        password: z.ZodString;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        purpose: z.ZodOptional<z.ZodString>;
        cardId: z.ZodOptional<z.ZodString>;
        imageBase64: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        password: string;
        role: "member" | "guest";
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
        cardId?: string | undefined;
        imageBase64?: string | undefined;
    }, {
        name: string;
        email: string;
        password: string;
        role: "member" | "guest";
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
        cardId?: string | undefined;
        imageBase64?: string | undefined;
    }>, {
        name: string;
        email: string;
        password: string;
        role: "member" | "guest";
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
        cardId?: string | undefined;
        imageBase64?: string | undefined;
    }, {
        name: string;
        email: string;
        password: string;
        role: "member" | "guest";
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
        cardId?: string | undefined;
        imageBase64?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        email: string;
        password: string;
        role: "member" | "guest";
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
        cardId?: string | undefined;
        imageBase64?: string | undefined;
    };
}, {
    body: {
        name: string;
        email: string;
        password: string;
        role: "member" | "guest";
        phoneNumber?: string | undefined;
        dateOfBirth?: string | undefined;
        purpose?: string | undefined;
        cardId?: string | undefined;
        imageBase64?: string | undefined;
    };
}>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        emailOrCardId: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        emailOrCardId: string;
    }, {
        password: string;
        emailOrCardId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        password: string;
        emailOrCardId: string;
    };
}, {
    body: {
        password: string;
        emailOrCardId: string;
    };
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        userId: string;
    }, {
        code: string;
        userId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        code: string;
        userId: string;
    };
}, {
    body: {
        code: string;
        userId: string;
    };
}>;
export declare const sendResetCodeSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
    };
}, {
    body: {
        email: string;
    };
}>;
export declare const checkResetCodeSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        code: string;
    }, {
        email: string;
        code: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        code: string;
    };
}, {
    body: {
        email: string;
        code: string;
    };
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        code: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        code: string;
        newPassword: string;
    }, {
        email: string;
        code: string;
        newPassword: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        code: string;
        newPassword: string;
    };
}, {
    body: {
        email: string;
        code: string;
        newPassword: string;
    };
}>;
