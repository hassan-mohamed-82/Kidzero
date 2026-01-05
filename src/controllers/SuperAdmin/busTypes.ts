import { Request , Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { db } from "../../models/db";
import { eq } from "drizzle-orm";
import { promocode } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { busTypes } from "../../models/superadmin/Bustype";

export const getAllBusTypes = async (req: Request, res: Response) => {
    const busTypes = await db.query.busTypes.findMany();
    return SuccessResponse(res, { busTypes }, 200);
};
export const getBusTypeById = async (req: Request, res: Response) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Bus Type Id");
    }
    const busType = await db.query.busTypes.findFirst({
        where: eq(promocode.id, Id)
    });
    if (!busType) {
        throw new BadRequest("Bus Type not found");
    }
    return SuccessResponse(res, { message: "Bus Type retrieved successfully", busType }, 200);
};

export const createBusType = async (req: Request, res: Response) => {
    const { name, capacity, description } = req.body;
    if (!name || !capacity) {
        throw new BadRequest("Missing required fields");
    }
    const newBusType = await db.insert(busTypes).values({
        organizationId: "org-123", // This should be replaced with actual organization ID from context
        name,
        capacity,
        description
    });
    return SuccessResponse(res, { message: "Bus Type created successfully"}, 201);
};

export const updateBusType = async (req: Request, res: Response) => {
    const { Id } = req.params;
    const { name, capacity, description, status } = req.body;
    if (!Id) {
        throw new BadRequest("Please Enter Bus Type Id");
    }
    const existingBusType = await db.query.busTypes.findFirst({
        where: eq(busTypes.id, Id)
    });
    if (!existingBusType) {
        throw new BadRequest("Bus Type not found");
    }
    await db.update(busTypes).set({
        name: name || existingBusType.name,
        capacity: capacity || existingBusType.capacity,
        description: description || existingBusType.description,
        status: status || existingBusType.status,
    }).where(eq(busTypes.id, Id));
    return SuccessResponse(res, { message: "Bus Type updated successfully" }, 200);
};
export const deleteBusType = async (req: Request, res: Response) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Bus Type Id");
    }
    const existingBusType = await db.query.busTypes.findFirst({
        where: eq(busTypes.id, Id)
    });
    if (!existingBusType) {
        throw new BadRequest("Bus Type not found");
    }
    await db.delete(busTypes).where(eq(busTypes.id, Id));
    return SuccessResponse(res, { message: "Bus Type deleted successfully" }, 200);
};