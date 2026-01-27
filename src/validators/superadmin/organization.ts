import z from "zod";

const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

export const createOrganizationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Organization name is required"),
        phone: z.string().min(1, "Phone number is required"),
        email: z.string().email("Invalid email format"),
        address: z.string().min(1, "Address is required"),
        organizationTypeId: z.string().uuid("Invalid Organization Type ID format"),
        logo: z.string().regex(BASE64_IMAGE_REGEX, "Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)"),
        adminPassword: z.string().min(8, "Password must be at least 8 characters"),
    }),
});

export const updateOrganizationSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid organization ID format"),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        email: z.string().email().optional(),
        address: z.string().min(1).optional(),
        organizationTypeId: z.string().uuid().optional(),
        logo: z.string().regex(BASE64_IMAGE_REGEX, "Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)").optional(),
    }),
});
