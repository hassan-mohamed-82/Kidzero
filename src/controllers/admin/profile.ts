// src/controllers/admin/adminController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins, roles } from "../../models/schema";
import { eq, and, ne } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";

export const getProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    if (id !== currentUserId) {
        throw new BadRequest("You can only access your own profile");
    }
    const admin = await db
        .select({
            id: admins.id,
            organizationId: admins.organizationId,
            name: admins.name,
            email: admins.email,
            phone: admins.phone,    
            avatar: admins.avatar,
            type: admins.type,
            permissions: admins.permissions,
            status: admins.status,
            createdAt: admins.createdAt,
            updatedAt: admins.updatedAt,
        })
        .from(admins)
        .where(
            and(
                eq(admins.id, id),
                eq(admins.organizationId, organizationId)
            )
        )
        .limit(1);
    if (!admin[0]) {
        throw new NotFound("Admin not found");
    }
    SuccessResponse(res, { admin: admin[0] }, 200);
};


export const updateProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    const { name, phone, avatar, password } = req.body;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    if (id !== currentUserId) {
        throw new BadRequest("You can only  update your own profile");
    }

    const admin = await db
        .select()
        .from(admins)
        .where(
            and(
                eq(admins.id, id),
                eq(admins.organizationId, organizationId)
            )
        )
        .limit(1);
    if (!admin[0]) {
        throw new NotFound("Admin not found");
    }
    const updatedData: any = {
        name: name ?? admin[0].name,
        phone: phone ?? admin[0].phone,
        avatar: avatar ?? admin[0].avatar,
    };
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updatedData.password = hashedPassword;
    }
    await db
        .update(admins)
        .set(updatedData)
        .where(
            and(
                eq(admins.id, id),
                eq(admins.organizationId, organizationId)
            )
        );
    SuccessResponse(res, { message: "Profile updated successfully" }, 200);
};
export const deleteProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    if (id !== currentUserId) {
        throw new BadRequest("You can only delete your own profile");
    }
    const admin = await db
        .select()
        .from(admins)
        .where(
            and(
                eq(admins.id, id),  
                eq(admins.organizationId, organizationId)
            )
        )
        .limit(1);
    if (!admin[0]) {
        throw new NotFound("Admin not found");
    }
    await db.delete(admins).where(
        and(
            eq(admins.id, id),
            eq(admins.organizationId, organizationId)
        )   
    );
    SuccessResponse(
        res,
        { message: "Profile deleted successfully" },
        200
    )
};



