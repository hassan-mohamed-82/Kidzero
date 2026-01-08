"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePromoCodeSchema = exports.createPromoCodeSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createPromoCodeSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required").max(255, "Name is too long"),
        code: zod_1.default.string().min(1, "Code is required").max(50, "Code is too long"),
        amount: zod_1.default.number().min(0, "Amount must be a positive number"),
        promocode_type: zod_1.default.enum(["percentage", "amount"], {
            errorMap: () => ({ message: "Invalid promocode type" }),
        }),
        description: zod_1.default.string().min(1, "Description is required"),
        start_date: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid start date",
        }),
        end_date: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid end date",
        }),
    }),
});
exports.updatePromoCodeSchema = zod_1.default.object({
    params: zod_1.default.object({
        Id: zod_1.default.string().uuid("Invalid Promo Code Id"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required").max(255, "Name is too long").optional(),
        code: zod_1.default.string().min(1, "Code is required").max(50, "Code is too long").optional(),
        amount: zod_1.default.number().min(0, "Amount must be a positive number").optional(),
        promocode_type: zod_1.default.enum(["percentage", "amount"], {
            errorMap: () => ({ message: "Invalid promocode type" }),
        }).optional(),
        description: zod_1.default.string().min(1, "Description is required").optional(),
        start_date: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid start date",
        }).optional(),
        end_date: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid end date",
        }).optional(),
    }),
});
