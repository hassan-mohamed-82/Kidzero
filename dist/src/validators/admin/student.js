"use strict";
// src/validations/studentValidation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentIdSchema = exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
exports.createStudentSchema = zod_1.z.object({
    body: zod_1.z.object({
        parentId: zod_1.z
            .string({ required_error: "Parent ID is required" })
            .uuid("Invalid Parent ID"),
        name: zod_1.z
            .string({ required_error: "Student name is required" })
            .min(1, "Student name cannot be empty")
            .max(255, "Student name cannot exceed 255 characters"),
        avatar: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .optional(),
        grade: zod_1.z
            .string()
            .max(50, "Grade cannot exceed 50 characters")
            .optional(),
        classroom: zod_1.z
            .string()
            .max(50, "Classroom cannot exceed 50 characters")
            .optional(),
    }),
});
exports.updateStudentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Student ID"),
    }),
    body: zod_1.z.object({
        parentId: zod_1.z
            .string()
            .uuid("Invalid Parent ID")
            .optional(),
        name: zod_1.z
            .string()
            .min(1, "Student name cannot be empty")
            .max(255, "Student name cannot exceed 255 characters")
            .optional(),
        avatar: zod_1.z
            .string()
            .regex(BASE64_IMAGE_REGEX, "Invalid avatar format")
            .nullable()
            .optional(),
        grade: zod_1.z
            .string()
            .max(50, "Grade cannot exceed 50 characters")
            .nullable()
            .optional(),
        classroom: zod_1.z
            .string()
            .max(50, "Classroom cannot exceed 50 characters")
            .nullable()
            .optional(),
        status: zod_1.z
            .enum(["active", "inactive"])
            .optional(),
    }),
});
exports.studentIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Student ID"),
    }),
});
