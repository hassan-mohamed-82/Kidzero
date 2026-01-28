"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.updateProfileSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required"),
        email: zod_1.default.string().email("Invalid email format"),
        password: zod_1.default.string().min(8, "Password must be at least 8 characters long"),
    }),
});
exports.changePasswordSchema = zod_1.default.object({
    body: zod_1.default.object({
        oldPassword: zod_1.default.string().min(8, "Old password must be at least 8 characters long"),
        newPassword: zod_1.default.string().min(8, "New password must be at least 8 characters long"),
    }),
});
