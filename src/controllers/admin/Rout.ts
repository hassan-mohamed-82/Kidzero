import { Request, Response } from "express";
import { db } from "../../models/db";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { Rout } from "../../models/schema";
import { eq } from "drizzle-orm";

export const getAllRoutes = async (req: Request, res: Response) => {
    const routes = await db.query.Rout.findMany();
    return SuccessResponse(res, { routes }, 200);
};

export const getRouteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Please Enter Route Id");
    }
    const route = await db.query.Rout.findFirst({
        where: (Rout, { eq }) => eq(Rout.id, id)
    });
    if (!route) {
        throw new BadRequest("Route not found");
    }
    return SuccessResponse(res, { route }, 200);
};

export const createRoute = async (req: Request, res: Response) => {
    const { name, description, startTime, endTime, organizationId } = req.body;
    if (!name || !organizationId || !startTime || !endTime) {
        throw new BadRequest("Missing required fields");
    }

    if(startTime >= endTime) {
        throw new BadRequest("Start time must be before end time");
    }

    const newRoute = await db.insert(Rout).values({
        name,
        description,
        startTime,
        endTime,
        organizationId
    });
    return SuccessResponse(res, { message: "Route created successfully" }, 201);
};

export const deleteRouteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Please Enter Route Id");
    }
    const selectedRoute = await db.query.Rout.findFirst({
        where: eq(Rout.id, id)
    });
};

export const updateRouteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, startTime, endTime, status , organizationId} = req.body;
    if (!id) {
        throw new BadRequest("Please Enter Route Id");
    }
    const existingRoute = await db.query.Rout.findFirst({
        where: eq(Rout.id, id)
    });
    if (!existingRoute) {
        throw new BadRequest("Route not found");
    }
    if(startTime >= endTime) {
        throw new BadRequest("Start time must be before end time");
    }
    await db.update(Rout).set({
        name: name || existingRoute.name,
        description: description || existingRoute.description,
        startTime: startTime || existingRoute.startTime,
        endTime: endTime || existingRoute.endTime,
        status: status || existingRoute.status,
        organizationId: organizationId || existingRoute.organizationId,
    }).where(eq(Rout.id, id));
    return SuccessResponse(res, { message: "Route updated successfully" }, 200);
};