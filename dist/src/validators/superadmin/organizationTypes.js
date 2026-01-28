"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganizationTypeSchema = exports.createOrganizationTypeSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createOrganizationTypeSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Organization type name is required"),
    }),
});
exports.updateOrganizationTypeSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string().uuid("Invalid organization type ID format"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).optional(),
    }),
});
