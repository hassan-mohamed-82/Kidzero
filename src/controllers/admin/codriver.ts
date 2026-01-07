// src/controllers/admin/codriverController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { codrivers } from "../../models/schema";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Codriver
export const createCodriver = async (req: Request, res: Response) => {
    const { name, phone, password, avatar, nationalId, nationalIdImage } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingCodriver = await db
        .select()
        .from(codrivers)
        .where(eq(codrivers.phone, phone))
        .limit(1);

    if (existingCodriver[0]) {
        throw new BadRequest("Phone number already registered");
    }

    const codriverId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl = null;
    let nationalIdImageUrl = null;

    if (avatar) {
        const result = await saveBase64Image(req, avatar, `codrivers/${codriverId}`);
        avatarUrl = result.url;
    }

    if (nationalIdImage) {
        const result = await saveBase64Image(req, nationalIdImage, `codrivers/${codriverId}`);
        nationalIdImageUrl = result.url;
    }

    await db.insert(codrivers).values({
        id: codriverId,
        organizationId,
        name,
        phone,
        password: hashedPassword,
        avatar: avatarUrl,
        nationalId: nationalId || null,
        nationalIdImage: nationalIdImageUrl,
    });

    SuccessResponse(res, { message: "Codriver created successfully", codriverId }, 201);
};

// ✅ Get All Codrivers
export const getAllCodrivers = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allCodrivers = await db
        .select({
            id: codrivers.id,
            name: codrivers.name,
            phone: codrivers.phone,
            avatar: codrivers.avatar,
            nationalId: codrivers.nationalId,
            nationalIdImage: codrivers.nationalIdImage,
            status: codrivers.status,
            createdAt: codrivers.createdAt,
            updatedAt: codrivers.updatedAt,
        })
        .from(codrivers)
        .where(eq(codrivers.organizationId, organizationId));

    SuccessResponse(res, { codrivers: allCodrivers }, 200);
};

// ✅ Get Codriver By ID
export const getCodriverById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const codriver = await db
        .select({
            id: codrivers.id,
            name: codrivers.name,
            phone: codrivers.phone,
            avatar: codrivers.avatar,
            nationalId: codrivers.nationalId,
            nationalIdImage: codrivers.nationalIdImage,
            status: codrivers.status,
            createdAt: codrivers.createdAt,
            updatedAt: codrivers.updatedAt,
        })
        .from(codrivers)
        .where(and(eq(codrivers.id, id), eq(codrivers.organizationId, organizationId)))
        .limit(1);

    if (!codriver[0]) {
        throw new NotFound("Codriver not found");
    }

    SuccessResponse(res, { codriver: codriver[0] }, 200);
};

// ✅ Update Codriver
export const updateCodriver = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, password, avatar, nationalId, nationalIdImage, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingCodriver = await db
        .select()
        .from(codrivers)
        .where(and(eq(codrivers.id, id), eq(codrivers.organizationId, organizationId)))
        .limit(1);

    if (!existingCodriver[0]) {
        throw new NotFound("Codriver not found");
    }

    if (phone && phone !== existingCodriver[0].phone) {
        const phoneExists = await db
            .select()
            .from(codrivers)
            .where(eq(codrivers.phone, phone))
            .limit(1);

        if (phoneExists[0]) {
            throw new BadRequest("Phone number already registered");
        }
    }

    let hashedPassword = existingCodriver[0].password;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    let avatarUrl = existingCodriver[0].avatar;
    if (avatar !== undefined) {
        if (existingCodriver[0].avatar) {
            await deletePhotoFromServer(existingCodriver[0].avatar);
        }
        if (avatar) {
            const result = await saveBase64Image(req, avatar, `codrivers/${id}`);
            avatarUrl = result.url;
        } else {
            avatarUrl = null;
        }
    }

    let nationalIdImageUrl = existingCodriver[0].nationalIdImage;
    if (nationalIdImage !== undefined) {
        if (existingCodriver[0].nationalIdImage) {
            await deletePhotoFromServer(existingCodriver[0].nationalIdImage);
        }
        if (nationalIdImage) {
            const result = await saveBase64Image(req, nationalIdImage, `codrivers/${id}`);
            nationalIdImageUrl = result.url;
        } else {
            nationalIdImageUrl = null;
        }
    }

    await db.update(codrivers).set({
        name: name ?? existingCodriver[0].name,
        phone: phone ?? existingCodriver[0].phone,
        password: hashedPassword,
        avatar: avatarUrl,
        nationalId: nationalId !== undefined ? nationalId : existingCodriver[0].nationalId,
        nationalIdImage: nationalIdImageUrl,
        status: status ?? existingCodriver[0].status,
    }).where(eq(codrivers.id, id));

    SuccessResponse(res, { message: "Codriver updated successfully" }, 200);
};

// ✅ Delete Codriver
export const deleteCodriver = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingCodriver = await db
        .select()
        .from(codrivers)
        .where(and(eq(codrivers.id, id), eq(codrivers.organizationId, organizationId)))
        .limit(1);

    if (!existingCodriver[0]) {
        throw new NotFound("Codriver not found");
    }

    if (existingCodriver[0].avatar) {
        await deletePhotoFromServer(existingCodriver[0].avatar);
    }
    if (existingCodriver[0].nationalIdImage) {
        await deletePhotoFromServer(existingCodriver[0].nationalIdImage);
    }

    await db.delete(codrivers).where(eq(codrivers.id, id));

    SuccessResponse(res, { message: "Codriver deleted successfully" }, 200);
};
