"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlanSchema = exports.createPlanSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createPlanSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required"),
        price: zod_1.default.number().min(0).default(0),
        max_buses: zod_1.default.number().int().min(1, "Max buses must be at least 1").default(10),
        max_drivers: zod_1.default.number().int().min(1, "Max drivers must be at least 1").default(20),
        max_students: zod_1.default.number().int().min(1, "Max students must be at least 1").default(100),
        min_subscription_fees_pay: zod_1.default.number().min(0).default(0),
        subscription_fees: zod_1.default.number().min(0).default(0),
    }),
});
exports.updatePlanSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string().uuid("Invalid plan ID format"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required").optional(),
        price: zod_1.default.number().min(0).optional(),
        maxBuses: zod_1.default.number().int().min(1, "Max buses must be at least 1").optional(),
        maxDrivers: zod_1.default.number().int().min(1, "Max drivers must be at least 1").optional(),
        maxStudents: zod_1.default.number().int().min(1, "Max students must be at least 1").optional(),
        minSubscriptionFeesPay: zod_1.default.number().min(0).optional(),
        subscriptionFees: zod_1.default.number().min(0).optional(),
    }),
});
