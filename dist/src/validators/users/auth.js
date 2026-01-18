"use strict";
// src/validators/mobileAuthValidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.changePasswordSchema = exports.mobileLoginSchema = void 0;
const zod_1 = require("zod");
// Login موحد - يدعم الدخول بالهاتف أو الإيميل
exports.mobileLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z
            .string({ required_error: "البريد الإلكتروني أو رقم الهاتف مطلوب" })
            .min(1, "البريد الإلكتروني أو رقم الهاتف مطلوب"),
        password: zod_1.z
            .string({ required_error: "كلمة المرور مطلوبة" })
            .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
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
