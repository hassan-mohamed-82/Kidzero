"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentMethodSchema = exports.createPaymentMethodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createPaymentMethodSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Payment method name is required"),
        description: zod_1.default.string().min(1, "Payment method description is required"),
        logo: zod_1.default.string().min(1, "Payment method logo is required"),
        is_active: zod_1.default.boolean().optional(),
        fee_status: zod_1.default.boolean().optional(),
        fee_amount: zod_1.default.number().optional(),
    }),
});
exports.updatePaymentMethodSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).optional(),
        description: zod_1.default.string().min(1).optional(),
        logo: zod_1.default.string().min(1).optional(),
        is_active: zod_1.default.boolean().optional(),
        fee_status: zod_1.default.boolean().optional(),
        fee_amount: zod_1.default.number().optional(),
    }),
});
