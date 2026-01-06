import { z } from "zod";
export const createAdminSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Name is required" })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        email: z
            .string({ required_error: "Email is required" })
            .email("Invalid email format"),
        password: z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        phone: z
            .string()
            .max(20, "Phone cannot exceed 20 characters")
            .optional(),
        avatar: z
            .string()
            .url("Avatar must be a valid URL")
            .optional(),
        roleId: z
            .string()
            .uuid("Invalid Role ID")
            .optional(),
        type: z
            .enum(["organizer", "admin"])
            .default("admin"),
    }),
});
export const updateAdminSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Admin ID"),
    }),
    body: z.object({
        name: z
            .string()
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters")
            .optional(),
        email: z
            .string()
            .email("Invalid email format")
            .optional(),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .optional(),
        phone: z
            .string()
            .max(20, "Phone cannot exceed 20 characters")
            .optional()
            .nullable(),
        avatar: z
            .string()
            .url("Avatar must be a valid URL")
            .optional()
            .nullable(),
        roleId: z
            .string()
            .uuid("Invalid Role ID")
            .optional()
            .nullable(),
        type: z
            .enum(["organizer", "admin"])
            .optional(),
        status: z
            .enum(["active", "inactive"])
            .optional(),
    }),
});
export const adminIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Admin ID"),
    }),
});
//# sourceMappingURL=admin.js.map