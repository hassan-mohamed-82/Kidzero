"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParentPlanSchema = exports.createParentPlanSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createParentPlanSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Parent plan name is required"),
        price: zod_1.default.number().min(1, "Parent plan price is required"),
        minSubscriptionfeesPay: zod_1.default.number().min(1, "Parent plan minSubscriptionfeesPay is required"),
        subscriptionFees: zod_1.default.number().min(1, "Parent plan subscriptionFees is required"),
    }),
});
exports.updateParentPlanSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string().uuid("Invalid parent plan ID format"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).optional(),
        price: zod_1.default.number().optional(),
        minSubscriptionfeesPay: zod_1.default.number().optional(),
        subscriptionFees: zod_1.default.number().optional(),
    }),
});
