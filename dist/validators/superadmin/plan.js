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
        price_semester: zod_1.default.number().min(0).optional(),
        price_year: zod_1.default.number().min(0).optional(),
        max_buses: zod_1.default.number().min(1, "Max buses must be at least 1"),
        max_drivers: zod_1.default.number().min(1, "Max drivers must be at least 1"),
        max_students: zod_1.default.number().min(1, "Max students must be at least 1"),
    }),
});
exports.updatePlanSchema = zod_1.default.object({
    params: zod_1.default.object({
        Id: zod_1.default.string().min(1, "Plan Id is required"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required").optional(),
        price_semester: zod_1.default.number().min(0).optional(),
        price_year: zod_1.default.number().min(0).optional(),
        max_buses: zod_1.default.number().min(1, "Max buses must be at least 1").optional(),
        max_drivers: zod_1.default.number().min(1, "Max drivers must be at least 1").optional(),
        max_students: zod_1.default.number().min(1, "Max students must be at least 1").optional(),
    }),
});
