// src/controllers/admin/routeController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { Rout, routePickupPoints, pickupPoints } from "../../models/schema";
import { eq, and, inArray } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Route
export const createRoute = async (req: Request, res: Response) => {
    const { name, description, pickupPoints: points } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingRoute = await db
        .select()
        .from(Rout)
        .where(and(eq(Rout.name, name), eq(Rout.organizationId, organizationId)))
        .limit(1);

    if (existingRoute[0]) {
        throw new BadRequest("Route with this name already exists");
    }

    const pickupPointIds = points.map((p: any) => p.pickupPointId);
    const existingPoints = await db
        .select()
        .from(pickupPoints)
        .where(inArray(pickupPoints.id, pickupPointIds));

    if (existingPoints.length !== pickupPointIds.length) {
        throw new BadRequest("One or more pickup points not found");
    }

    const routeId = uuidv4();

    await db.insert(Rout).values({
        id: routeId,
        organizationId,
        name,
        description: description || null,
    });

    const routePickupPointsData = points.map((point: any) => ({
        routeId,
        pickupPointId: point.pickupPointId,
        stopOrder: point.stopOrder,
        estimatedArrival: point.estimatedArrival || null,
    }));

    await db.insert(routePickupPoints).values(routePickupPointsData);

    SuccessResponse(res, { message: "Route created successfully", routeId }, 201);
};

// ✅ Get All Routes
export const getAllRoutes = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allRoutes = await db
        .select()
        .from(Rout)
        .where(eq(Rout.organizationId, organizationId));

    const routesWithPickupPoints = await Promise.all(
        allRoutes.map(async (route) => {
            const points = await db
                .select({
                    id: routePickupPoints.id,
                    stopOrder: routePickupPoints.stopOrder,
                    estimatedArrival: routePickupPoints.estimatedArrival,
                    pickupPoint: {
                        id: pickupPoints.id,
                        name: pickupPoints.name,
                        address: pickupPoints.address,
                        lat: pickupPoints.lat,
                        lng: pickupPoints.lng,
                    },
                })
                .from(routePickupPoints)
                .leftJoin(pickupPoints, eq(routePickupPoints.pickupPointId, pickupPoints.id))
                .where(eq(routePickupPoints.routeId, route.id))
                .orderBy(routePickupPoints.stopOrder);

            return { ...route, pickupPoints: points };
        })
    );

    SuccessResponse(res, { routes: routesWithPickupPoints }, 200);
};

// ✅ Get Route By ID
export const getRouteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const route = await db
        .select()
        .from(Rout)
        .where(and(eq(Rout.id, id), eq(Rout.organizationId, organizationId)))
        .limit(1);

    if (!route[0]) {
        throw new NotFound("Route not found");
    }

    const points = await db
        .select({
            id: routePickupPoints.id,
            stopOrder: routePickupPoints.stopOrder,
            estimatedArrival: routePickupPoints.estimatedArrival,
            pickupPoint: {
                id: pickupPoints.id,
                name: pickupPoints.name,
                address: pickupPoints.address,
                lat: pickupPoints.lat,
                lng: pickupPoints.lng,
            },
        })
        .from(routePickupPoints)
        .leftJoin(pickupPoints, eq(routePickupPoints.pickupPointId, pickupPoints.id))
        .where(eq(routePickupPoints.routeId, id))
        .orderBy(routePickupPoints.stopOrder);

    SuccessResponse(res, { route: { ...route[0], pickupPoints: points } }, 200);
};

// ✅ Update Route
export const updateRoute = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, pickupPoints: points, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingRoute = await db
        .select()
        .from(Rout)
        .where(and(eq(Rout.id, id), eq(Rout.organizationId, organizationId)))
        .limit(1);

    if (!existingRoute[0]) {
        throw new NotFound("Route not found");
    }

    if (name && name !== existingRoute[0].name) {
        const duplicateName = await db
            .select()
            .from(Rout)
            .where(and(eq(Rout.name, name), eq(Rout.organizationId, organizationId)))
            .limit(1);

        if (duplicateName[0]) {
            throw new BadRequest("Route with this name already exists");
        }
    }

    await db.update(Rout).set({
        name: name ?? existingRoute[0].name,
        description: description !== undefined ? description : existingRoute[0].description,
        status: status ?? existingRoute[0].status,
    }).where(eq(Rout.id, id));

    if (points !== undefined) {
        await db.delete(routePickupPoints).where(eq(routePickupPoints.routeId, id));

        if (points.length > 0) {
            const pickupPointIds = points.map((p: any) => p.pickupPointId);

            const uniqueIds = [...new Set(pickupPointIds)];
            if (uniqueIds.length !== pickupPointIds.length) {
                throw new BadRequest("Duplicate pickup points not allowed");
            }

            const stopOrders = points.map((p: any) => p.stopOrder);
            const uniqueOrders = [...new Set(stopOrders)];
            if (uniqueOrders.length !== stopOrders.length) {
                throw new BadRequest("Duplicate stop orders not allowed");
            }

            const existingPoints = await db
                .select()
                .from(pickupPoints)
                .where(inArray(pickupPoints.id, pickupPointIds));

            if (existingPoints.length !== pickupPointIds.length) {
                throw new BadRequest("One or more pickup points not found");
            }

            const routePickupPointsData = points.map((point: any) => ({
                routeId: id,
                pickupPointId: point.pickupPointId,
                stopOrder: point.stopOrder,
                estimatedArrival: point.estimatedArrival || null,
            }));

            await db.insert(routePickupPoints).values(routePickupPointsData);
        }
    }

    const updatedRoute = await db
        .select()
        .from(Rout)
        .where(eq(Rout.id, id))
        .limit(1);

    const updatedPoints = await db
        .select({
            id: routePickupPoints.id,
            stopOrder: routePickupPoints.stopOrder,
            estimatedArrival: routePickupPoints.estimatedArrival,
            pickupPoint: {
                id: pickupPoints.id,
                name: pickupPoints.name,
                address: pickupPoints.address,
                lat: pickupPoints.lat,
                lng: pickupPoints.lng,
            },
        })
        .from(routePickupPoints)
        .leftJoin(pickupPoints, eq(routePickupPoints.pickupPointId, pickupPoints.id))
        .where(eq(routePickupPoints.routeId, id))
        .orderBy(routePickupPoints.stopOrder);

    SuccessResponse(res, {
        message: "Route updated successfully",
        route: { ...updatedRoute[0], pickupPoints: updatedPoints },
    }, 200);
};

// ✅ Delete Route
export const deleteRoute = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingRoute = await db
        .select()
        .from(Rout)
        .where(and(eq(Rout.id, id), eq(Rout.organizationId, organizationId)))
        .limit(1);

    if (!existingRoute[0]) {
        throw new NotFound("Route not found");
    }

    await db.delete(routePickupPoints).where(eq(routePickupPoints.routeId, id));
    await db.delete(Rout).where(eq(Rout.id, id));

    SuccessResponse(res, { message: "Route deleted successfully" }, 200);
};
