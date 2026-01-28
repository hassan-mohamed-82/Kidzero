"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganizationSchema = exports.createOrganizationSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
exports.createOrganizationSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Organization name is required"),
        phone: zod_1.default.string().min(1, "Phone number is required"),
        email: zod_1.default.string().email("Invalid email format"),
        address: zod_1.default.string().min(1, "Address is required"),
        organizationTypeId: zod_1.default.string().uuid("Invalid Organization Type ID format"),
        logo: zod_1.default.string().regex(BASE64_IMAGE_REGEX, "Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)"),
        adminPassword: zod_1.default.string().min(8, "Password must be at least 8 characters"),
    }),
});
exports.updateOrganizationSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string().uuid("Invalid organization ID format"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).optional(),
        phone: zod_1.default.string().min(1).optional(),
        email: zod_1.default.string().email().optional(),
        address: zod_1.default.string().min(1).optional(),
        organizationTypeId: zod_1.default.string().uuid().optional(),
        logo: zod_1.default.string().regex(BASE64_IMAGE_REGEX, "Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)").optional(),
    }),
});
