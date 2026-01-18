// src/controllers/admin/driverController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { drivers } from "../../models/schema";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { checkDriverLimit } from "../../utils/helperfunction";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Driver
export const createDriver = async (req: Request, res: Response) => {
    const { name, phone, password,email ,avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    // Check subscription limit

    
 //   await checkDriverLimit(organizationId);

    // Check if phone already exists
    const existingDriver = await db
        .select()
        .from(drivers)
        .where(eq(drivers.phone, phone))
        .limit(1);

    if (existingDriver[0]) {
        throw new BadRequest("Phone number already registered");
    }

    const driverId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle images
    let avatarUrl = null;
    let licenseImageUrl = null;
    let nationalIdImageUrl = null;

    if (avatar) {
        const result = await saveBase64Image(req, avatar, `drivers/${driverId}`);
        avatarUrl = result.url;
    }

    if (licenseImage) {
        const result = await saveBase64Image(req, licenseImage, `drivers/${driverId}`);
        licenseImageUrl = result.url;
    }

    if (nationalIdImage) {
        const result = await saveBase64Image(req, nationalIdImage, `drivers/${driverId}`);
        nationalIdImageUrl = result.url;
    }

    await db.insert(drivers).values({
        id: driverId,
        organizationId,
        email,
        name,
        phone,
        password: hashedPassword,
        avatar: avatarUrl,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        licenseImage: licenseImageUrl,
        nationalId: nationalId || null,
        nationalIdImage: nationalIdImageUrl,
    });

    SuccessResponse(res, { message: "Driver created successfully", driverId }, 201);
};

// ✅ Get All Drivers
export const getAllDrivers = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allDrivers = await db
        .select({
            id: drivers.id,
            name: drivers.name,
            phone: drivers.phone,
            avatar: drivers.avatar,
            licenseExpiry: drivers.licenseExpiry,
            licenseImage: drivers.licenseImage,
            nationalId: drivers.nationalId,
            nationalIdImage: drivers.nationalIdImage,
            status: drivers.status,
            createdAt: drivers.createdAt,
            updatedAt: drivers.updatedAt,
        })
        .from(drivers)
        .where(eq(drivers.organizationId, organizationId));

    SuccessResponse(res, { drivers: allDrivers }, 200);
};

// ✅ Get Driver By ID
export const getDriverById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const driver = await db
        .select({
            id: drivers.id,
            name: drivers.name,
            phone: drivers.phone,
            avatar: drivers.avatar,
            licenseExpiry: drivers.licenseExpiry,
            licenseImage: drivers.licenseImage,
            nationalId: drivers.nationalId,
            nationalIdImage: drivers.nationalIdImage,
            status: drivers.status,
            createdAt: drivers.createdAt,
            updatedAt: drivers.updatedAt,
        })
        .from(drivers)
        .where(and(eq(drivers.id, id), eq(drivers.organizationId, organizationId)))
        .limit(1);

    if (!driver[0]) {
        throw new NotFound("Driver not found");
    }

    SuccessResponse(res, { driver: driver[0] }, 200);
};

// ✅ Update Driver
export const updateDriver = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, password,email, avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingDriver = await db
        .select()
        .from(drivers)
        .where(and(eq(drivers.id, id), eq(drivers.organizationId, organizationId)))
        .limit(1);

    if (!existingDriver[0]) {
        throw new NotFound("Driver not found");
    }

    // Check if phone is being changed and already exists
    if (phone && phone !== existingDriver[0].phone) {
        const phoneExists = await db
            .select()
            .from(drivers)
            .where(eq(drivers.phone, phone))
            .limit(1);

        if (phoneExists[0]) {
            throw new BadRequest("Phone number already registered");
        }
    }

    // Handle password
    let hashedPassword = existingDriver[0].password;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    // Handle avatar
    let avatarUrl = existingDriver[0].avatar;
    if (avatar !== undefined) {
        if (existingDriver[0].avatar) {
            await deletePhotoFromServer(existingDriver[0].avatar);
        }
        if (avatar) {
            const result = await saveBase64Image(req, avatar, `drivers/${id}`);
            avatarUrl = result.url;
        } else {
            avatarUrl = null;
        }
    }

    // Handle license image
    let licenseImageUrl = existingDriver[0].licenseImage;
    if (licenseImage !== undefined) {
        if (existingDriver[0].licenseImage) {
            await deletePhotoFromServer(existingDriver[0].licenseImage);
        }
        if (licenseImage) {
            const result = await saveBase64Image(req, licenseImage, `drivers/${id}`);
            licenseImageUrl = result.url;
        } else {
            licenseImageUrl = null;
        }
    }

    // Handle national ID image
    let nationalIdImageUrl = existingDriver[0].nationalIdImage;
    if (nationalIdImage !== undefined) {
        if (existingDriver[0].nationalIdImage) {
            await deletePhotoFromServer(existingDriver[0].nationalIdImage);
        }
        if (nationalIdImage) {
            const result = await saveBase64Image(req, nationalIdImage, `drivers/${id}`);
            nationalIdImageUrl = result.url;
        } else {
            nationalIdImageUrl = null;
        }
    }

    await db.update(drivers).set({
        name: name ?? existingDriver[0].name,
        phone: phone ?? existingDriver[0].phone,
        password: hashedPassword,
        email: email ?? existingDriver[0].email,
        avatar: avatarUrl,
        licenseExpiry: licenseExpiry !== undefined 
            ? (licenseExpiry ? new Date(licenseExpiry) : null) 
            : existingDriver[0].licenseExpiry,
        licenseImage: licenseImageUrl,
        nationalId: nationalId !== undefined ? nationalId : existingDriver[0].nationalId,
        nationalIdImage: nationalIdImageUrl,
        status: status ?? existingDriver[0].status,
    }).where(eq(drivers.id, id));

    SuccessResponse(res, { message: "Driver updated successfully" }, 200);
};

// ✅ Delete Driver
export const deleteDriver = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingDriver = await db
        .select()
        .from(drivers)
        .where(and(eq(drivers.id, id), eq(drivers.organizationId, organizationId)))
        .limit(1);

    if (!existingDriver[0]) {
        throw new NotFound("Driver not found");
    }

    // Delete images
    if (existingDriver[0].avatar) {
        await deletePhotoFromServer(existingDriver[0].avatar);
    }
    if (existingDriver[0].licenseImage) {
        await deletePhotoFromServer(existingDriver[0].licenseImage);
    }
    if (existingDriver[0].nationalIdImage) {
        await deletePhotoFromServer(existingDriver[0].nationalIdImage);
    }

    await db.delete(drivers).where(eq(drivers.id, id));

    SuccessResponse(res, { message: "Driver deleted successfully" }, 200);
};
