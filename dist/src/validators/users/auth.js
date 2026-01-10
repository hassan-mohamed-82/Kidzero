"use strict";
// src/validators/mobileAuthValidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.changePasswordSchema = exports.mobileLoginSchema = void 0;
const zod_1 = require("zod");
// Login موحد
exports.mobileLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z
            .string()
            .min(10, "Phone number must be at least 10 digits")
            .max(20, "Phone number must be at most 20 digits")
            .regex(/^[0-9+]+$/, "Phone number must contain only digits"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    }),
});
// Change Password
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        oldPassword: zod_1.z.string().min(6, "Old password must be at least 6 characters"),
        newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters"),
    }),
});
// Update Profile
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        avatar: zod_1.z.string().max(500).optional(),
        address: zod_1.z.string().max(500).optional(),
    }),
});
