"use strict";
// src/controllers/admin/routeController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoute = exports.updateRoute = exports.getRouteById = exports.getAllRoutes = exports.createRoute = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const uuid_1 = require("uuid"); // ✅ أضف ده
// ✅ Create Route with Pickup Points
const createRoute = async (req, res) => {
    const { name, description, startTime, endTime, pickupPoints: points } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // تحقق من عدم تكرار اسم الـ Route
    const existingRoute = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.name, name), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
        .limit(1);
    if (existingRoute[0]) {
        throw new BadRequest_1.BadRequest("Route with this name already exists");
    }
    // تحقق من وجود كل الـ Pickup Points
    const pickupPointIds = points.map((p) => p.pickupPointId);
    const existingPoints = await db_1.db
        .select()
        .from(schema_1.pickupPoints)
        .where((0, drizzle_orm_1.inArray)(schema_1.pickupPoints.id, pickupPointIds));
    if (existingPoints.length !== pickupPointIds.length) {
        throw new BadRequest_1.BadRequest("One or more pickup points not found");
    }
    // إنشاء UUID
    const routeId = (0, uuid_1.v4)();
    // إنشاء الـ Route
    await db_1.db.insert(schema_1.Rout).values({
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
    await db_1.db.insert(schema_1.routePickupPoints).values(routePickupPointsData);
    (0, response_1.SuccessResponse)(res, { message: "Route created successfully", routeId }, 201);
};
exports.createRoute = createRoute;
// ✅ Get All Routes
const getAllRoutes = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allRoutes = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId));
    // جلب الـ Pickup Points لكل Route
    const routesWithPickupPoints = await Promise.all(allRoutes.map(async (route) => {
        const points = await db_1.db
            .select({
            id: schema_1.routePickupPoints.id,
            stopOrder: schema_1.routePickupPoints.stopOrder,
            estimatedArrival: schema_1.routePickupPoints.estimatedArrival,
            pickupPoint: {
                id: schema_1.pickupPoints.id,
                name: schema_1.pickupPoints.name,
                address: schema_1.pickupPoints.address,
                lat: schema_1.pickupPoints.lat,
                lng: schema_1.pickupPoints.lng,
            },
        })
            .from(schema_1.routePickupPoints)
            .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.pickupPoints.id))
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, route.id))
            .orderBy(schema_1.routePickupPoints.stopOrder);
        return {
            ...route,
            pickupPoints: points,
        };
    }));
    (0, response_1.SuccessResponse)(res, { routes: routesWithPickupPoints }, 200);
};
exports.getAllRoutes = getAllRoutes;
// ✅ Get Route By ID
const getRouteById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const route = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.id, id), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
        .limit(1);
    if (!route[0]) {
        throw new NotFound_1.NotFound("Route not found");
    }
    // جلب الـ Pickup Points
    const points = await db_1.db
        .select({
        id: schema_1.routePickupPoints.id,
        stopOrder: schema_1.routePickupPoints.stopOrder,
        estimatedArrival: schema_1.routePickupPoints.estimatedArrival,
        pickupPoint: {
            id: schema_1.pickupPoints.id,
            name: schema_1.pickupPoints.name,
            address: schema_1.pickupPoints.address,
            lat: schema_1.pickupPoints.lat,
            lng: schema_1.pickupPoints.lng,
        },
    })
        .from(schema_1.routePickupPoints)
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, id))
        .orderBy(schema_1.routePickupPoints.stopOrder);
    (0, response_1.SuccessResponse)(res, {
        route: {
            ...route[0],
            pickupPoints: points,
        },
    }, 200);
};
exports.getRouteById = getRouteById;
// ✅ Update Route
const updateRoute = async (req, res) => {
    const { id } = req.params;
    const { name, description, startTime, endTime, pickupPoints: points, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // تحقق من وجود الـ Route
    const existingRoute = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.id, id), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
        .limit(1);
    if (!existingRoute[0]) {
        throw new NotFound_1.NotFound("Route not found");
    }
    // لو بيغير الاسم، نتحقق إنه مش مكرر
    if (name && name !== existingRoute[0].name) {
        const duplicateName = await db_1.db
            .select()
            .from(schema_1.Rout)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.name, name), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
            .limit(1);
        if (duplicateName[0]) {
            throw new BadRequest_1.BadRequest("Route with this name already exists");
        }
    }
    // تحديث الـ Route
    await db_1.db
        .update(schema_1.Rout)
        .set({
        name: name ?? existingRoute[0].name,
        description: description !== undefined ? description : existingRoute[0].description,
        startTime: startTime !== undefined ? startTime : existingRoute[0].startTime,
        endTime: endTime !== undefined ? endTime : existingRoute[0].endTime,
        status: status ?? existingRoute[0].status,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.Rout.id, id));
    // لو فيه Pickup Points في الـ Request
    if (points !== undefined) {
        // لو Array فاضي - نحذف كل الـ Pickup Points
        if (points.length === 0) {
            await db_1.db.delete(schema_1.routePickupPoints).where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, id));
        }
        else {
            // تحقق من وجود كل الـ Pickup Points
            const pickupPointIds = points.map((p) => p.pickupPointId);
            const existingPoints = await db_1.db
                .select()
                .from(schema_1.pickupPoints)
                .where((0, drizzle_orm_1.inArray)(schema_1.pickupPoints.id, pickupPointIds));
            if (existingPoints.length !== pickupPointIds.length) {
                throw new BadRequest_1.BadRequest("One or more pickup points not found");
            }
            // تحقق من عدم تكرار الـ Pickup Points
            const uniqueIds = [...new Set(pickupPointIds)];
            if (uniqueIds.length !== pickupPointIds.length) {
                throw new BadRequest_1.BadRequest("Duplicate pickup points not allowed");
            }
            // تحقق من عدم تكرار الـ Stop Order
            const stopOrders = points.map((p) => p.stopOrder);
            const uniqueOrders = [...new Set(stopOrders)];
            if (uniqueOrders.length !== stopOrders.length) {
                throw new BadRequest_1.BadRequest("Duplicate stop orders not allowed");
            }
            // حذف الـ Pickup Points القديمة
            await db_1.db.delete(schema_1.routePickupPoints).where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, id));
            // إضافة الـ Pickup Points الجديدة
            const routePickupPointsData = points.map((point) => ({
                routeId: id,
                pickupPointId: point.pickupPointId,
                stopOrder: point.stopOrder,
                estimatedArrival: point.estimatedArrival || null,
            }));
            await db_1.db.insert(schema_1.routePickupPoints).values(routePickupPointsData);
        }
    }
    // جلب الـ Route المحدث مع الـ Pickup Points
    const updatedPoints = await db_1.db
        .select({
        id: schema_1.routePickupPoints.id,
        stopOrder: schema_1.routePickupPoints.stopOrder,
        estimatedArrival: schema_1.routePickupPoints.estimatedArrival,
        pickupPoint: {
            id: schema_1.pickupPoints.id,
            name: schema_1.pickupPoints.name,
            address: schema_1.pickupPoints.address,
            lat: schema_1.pickupPoints.lat,
            lng: schema_1.pickupPoints.lng,
        },
    })
        .from(schema_1.routePickupPoints)
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, id))
        .orderBy(schema_1.routePickupPoints.stopOrder);
    const updatedRoute = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.eq)(schema_1.Rout.id, id))
        .limit(1);
    (0, response_1.SuccessResponse)(res, {
        message: "Route updated successfully",
        route: {
            ...updatedRoute[0],
            pickupPoints: updatedPoints,
        },
    }, 200);
};
exports.updateRoute = updateRoute;
// ✅ Delete Route
const deleteRoute = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingRoute = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.id, id), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
        .limit(1);
    if (!existingRoute[0]) {
        throw new NotFound_1.NotFound("Route not found");
    }
    // حذف الـ Pickup Points المرتبطة أولاً
    await db_1.db.delete(schema_1.routePickupPoints).where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, id));
    // حذف الـ Route
    await db_1.db.delete(schema_1.Rout).where((0, drizzle_orm_1.eq)(schema_1.Rout.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Route deleted successfully" }, 200);
};
exports.deleteRoute = deleteRoute;
