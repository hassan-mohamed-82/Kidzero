import { Request, Response } from "express";
import { db } from "../../models/db";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { superAdmins } from "../../models/schema";
import { BadRequest } from "../../Errors/BadRequest";
import { UnauthorizedError } from "../../Errors";
import bcrypt from "bcrypt";

export const getProfile = async (req: Request, res: Response) => {
    const superAdminId = req.user?.id;
    const superAdmin = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.id, superAdminId!),
        columns: {
            passwordHashed: false, // Exclude password from query
        }
    });

    if (!superAdmin) {
        throw new NotFound("Super Admin not found");
    }

    return SuccessResponse(res, {
        message: "Super Admin profile fetched successfully",
        data: superAdmin,
    });
};

export const updateProfile = async (req: Request, res: Response) => {
    const superAdminId = req.user?.id;
    const { name, email, password } = req.body;

    if (!password) {
        throw new BadRequest("Password is required to update profile");
    }

    const superAdmin = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.id, superAdminId!),
    });

    if (!superAdmin) {
        throw new NotFound("Super Admin not found");
    }
    const match = await bcrypt.compare(password, superAdmin.passwordHashed);
    if (!match) {
        throw new UnauthorizedError("Invalid password");
    } else {
        const updatedSuperAdmin = await db
            .update(superAdmins)
            .set({
                name: name || superAdmin.name,
                email: email || superAdmin.email
            })
            .where(eq(superAdmins.id, superAdminId!));
        return SuccessResponse(res, {
            message: "Super Admin profile updated successfully"
        });
    }

};

export const changePassword = async (req: Request, res: Response) => {
    const superAdminId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new BadRequest("Current and new passwords are required");
    }
    const superAdmin = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.id, superAdminId!),
    });
    if (!superAdmin) {
        throw new NotFound("Super Admin not found");
    }
    const match = await bcrypt.compare(currentPassword, superAdmin.passwordHashed);
    if (!match) {
        throw new UnauthorizedError("Invalid current password");
    } else {
        if (currentPassword === newPassword) {
            throw new BadRequest("New password must be different from current password");
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(superAdmins)
            .set({ passwordHashed: hashedPassword })
            .where(eq(superAdmins.id, superAdminId!));
        return SuccessResponse(res, {
            message: "Password changed successfully"
        });
    }
};

