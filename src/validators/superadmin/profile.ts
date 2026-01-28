import z from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(8, "Old password must be at least 8 characters long"),
        newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    }),
});