// src/controllers/admin/routeController.ts
import { db } from "../../models/db";
import { Rout, routePickupPoints, pickupPoints } from "../../models/schema";
import { eq, and, inArray } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { v4 as uuidv4 } from "uuid"; // ✅ أضف ده
// ✅ Create Route with Pickup Points
export const createRoute = async (req, res) => {
    const { name, description, startTime, endTime, pickupPoints: points } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    // تحقق من عدم تكرار اسم الـ Route
    const existingRoute = await db
        .select()
        .from(Rout)
        .where(and(eq(Rout.name, name), eq(Rout.organizationId, organizationId)))
        .limit(1);
    if (existingRoute[0]) {
        throw new BadRequest("Route with this name already exists");
    }
    // تحقق من وجود كل الـ Pickup Points
    const pickupPointIds = points.map((p) => p.pickupPointId);
    const existingPoints = await db
        .select()
        .from(pickupPoints)
        .where(inArray(pickupPoints.id, pickupPointIds));
    if (existingPoints.length !== pickupPointIds.length) {
        throw new BadRequest("One or more pickup points not found");
    }
    // إنشاء UUID
    const routeId = uuidv4();
    // إنشاء الـ Route
    await db.insert(Rout).values({
        id: routeId,
        organizationId,
        name,
        description: description || null,
        startTime: startTime || null,
        endTime: endTime || null,
    });
    // إضافة الـ Pickup Points للـ Route
    const routePickupPointsData = points.map((point) => ({
        routeId,
        pickupPointId: point.pickupPointId,
        stopOrder: point.stopOrder,
        estimatedArrival: point.estimatedArrival || null,
    }));
    await db.insert(routePickupPoints).values(routePickupPointsData);
    SuccessResponse(res, { message: "Route created successfully", routeId }, 201);
};
// ✅ Get All Routes
export const getAllRoutes = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const allRoutes = await db
        .select()
        .from(Rout)
        .where(eq(Rout.organizationId, organizationId));
    // جلب الـ Pickup Points لكل Route
    const routesWithPickupPoints = await Promise.all(allRoutes.map(async (route) => {
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
        return {
            ...route,
            pickupPoints: points,
        };
    }));
    SuccessResponse(res, { routes: routesWithPickupPoints }, 200);
};
// ✅ Get Route By ID
export const getRouteById = async (req, res) => {
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
    // جلب الـ Pickup Points
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
    SuccessResponse(res, {
        route: {
            ...route[0],
            pickupPoints: points,
        },
    }, 200);
};
// ✅ Update Route
export const updateRoute = async (req, res) => {
    const { id } = req.params;
    const { name, description, startTime, endTime, pickupPoints: points, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    // تحقق من وجود الـ Route
    const existingRoute = await db
        .select()
        .from(Rout)
        .where(and(eq(Rout.id, id), eq(Rout.organizationId, organizationId)))
        .limit(1);
    if (!existingRoute[0]) {
        throw new NotFound("Route not found");
    }
    // لو بيغير الاسم، نتحقق إنه مش مكرر
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
    // تحديث الـ Route
    await db
        .update(Rout)
        .set({
        name: name ?? existingRoute[0].name,
        description: description !== undefined ? description : existingRoute[0].description,
        startTime: startTime !== undefined ? startTime : existingRoute[0].startTime,
        endTime: endTime !== undefined ? endTime : existingRoute[0].endTime,
        status: status ?? existingRoute[0].status,
    })
        .where(eq(Rout.id, id));
    // لو فيه Pickup Points في الـ Request
    if (points !== undefined) {
        // لو Array فاضي - نحذف كل الـ Pickup Points
        if (points.length === 0) {
            await db.delete(routePickupPoints).where(eq(routePickupPoints.routeId, id));
        }
        else {
            // تحقق من وجود كل الـ Pickup Points
            const pickupPointIds = points.map((p) => p.pickupPointId);
            const existingPoints = await db
                .select()
                .from(pickupPoints)
                .where(inArray(pickupPoints.id, pickupPointIds));
            if (existingPoints.length !== pickupPointIds.length) {
                throw new BadRequest("One or more pickup points not found");
            }
            // تحقق من عدم تكرار الـ Pickup Points
            const uniqueIds = [...new Set(pickupPointIds)];
            if (uniqueIds.length !== pickupPointIds.length) {
                throw new BadRequest("Duplicate pickup points not allowed");
            }
            // تحقق من عدم تكرار الـ Stop Order
            const stopOrders = points.map((p) => p.stopOrder);
            const uniqueOrders = [...new Set(stopOrders)];
            if (uniqueOrders.length !== stopOrders.length) {
                throw new BadRequest("Duplicate stop orders not allowed");
            }
            // حذف الـ Pickup Points القديمة
            await db.delete(routePickupPoints).where(eq(routePickupPoints.routeId, id));
            // إضافة الـ Pickup Points الجديدة
            const routePickupPointsData = points.map((point) => ({
                routeId: id,
                pickupPointId: point.pickupPointId,
                stopOrder: point.stopOrder,
                estimatedArrival: point.estimatedArrival || null,
            }));
            await db.insert(routePickupPoints).values(routePickupPointsData);
        }
    }
    // جلب الـ Route المحدث مع الـ Pickup Points
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
    const updatedRoute = await db
        .select()
        .from(Rout)
        .where(eq(Rout.id, id))
        .limit(1);
    SuccessResponse(res, {
        message: "Route updated successfully",
        route: {
            ...updatedRoute[0],
            pickupPoints: updatedPoints,
        },
    }, 200);
};
// ✅ Delete Route
export const deleteRoute = async (req, res) => {
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
    // حذف الـ Pickup Points المرتبطة أولاً
    await db.delete(routePickupPoints).where(eq(routePickupPoints.routeId, id));
    // حذف الـ Route
    await db.delete(Rout).where(eq(Rout.id, id));
    SuccessResponse(res, { message: "Route deleted successfully" }, 200);
};
//# sourceMappingURL=Rout.js.map