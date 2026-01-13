"use strict";
// src/controllers/admin/routeController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPickupPoints = exports.deleteRoute = exports.updateRoute = exports.getRouteById = exports.getAllRoutes = exports.createRoute = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const uuid_1 = require("uuid");
// ✅ Create Route
const createRoute = async (req, res) => {
    const { name, description, pickupPoints: points } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingRoute = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.name, name), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
        .limit(1);
    if (existingRoute[0]) {
        throw new BadRequest_1.BadRequest("Route with this name already exists");
    }
    const pickupPointIds = points.map((p) => p.pickupPointId);
    const uniqueIds = [...new Set(pickupPointIds)];
    if (uniqueIds.length !== pickupPointIds.length) {
        throw new BadRequest_1.BadRequest("Duplicate pickup points not allowed");
    }
    const stopOrders = points.map((p) => p.stopOrder);
    const uniqueOrders = [...new Set(stopOrders)];
    if (uniqueOrders.length !== stopOrders.length) {
        throw new BadRequest_1.BadRequest("Duplicate stop orders not allowed");
    }
    const existingPoints = await db_1.db
        .select()
        .from(schema_1.pickupPoints)
        .where((0, drizzle_orm_1.inArray)(schema_1.pickupPoints.id, pickupPointIds));
    if (existingPoints.length !== pickupPointIds.length) {
        throw new BadRequest_1.BadRequest("One or more pickup points not found");
    }
    const routeId = (0, uuid_1.v4)();
    // ✅ Raw SQL - MySQL هيستخدم الـ DEFAULT values
    await db_1.db.execute((0, drizzle_orm_1.sql) `INSERT INTO routes (id, organization_id, name, description) 
        VALUES (${routeId}, ${organizationId}, ${name}, ${description || null})`);
    // ✅ Insert Pickup Points
    for (const point of points) {
        await db_1.db.execute((0, drizzle_orm_1.sql) `INSERT INTO route_pickup_points (id, route_id, pickup_point_id, stop_order) 
          VALUES (${(0, uuid_1.v4)()}, ${routeId}, ${point.pickupPointId}, ${point.stopOrder})`);
    }
    // جلب الـ Route الجديد
    const [createdRoute] = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.eq)(schema_1.Rout.id, routeId))
        .limit(1);
    const createdPoints = await db_1.db
        .select({
        id: schema_1.routePickupPoints.id,
        stopOrder: schema_1.routePickupPoints.stopOrder,
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
        .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, routeId))
        .orderBy(schema_1.routePickupPoints.stopOrder);
    (0, response_1.SuccessResponse)(res, {
        message: "Route created successfully",
        route: { ...createdRoute, pickupPoints: createdPoints },
    }, 201);
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
    const routesWithPickupPoints = await Promise.all(allRoutes.map(async (route) => {
        const points = await db_1.db
            .select({
            id: schema_1.routePickupPoints.id,
            stopOrder: schema_1.routePickupPoints.stopOrder,
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
        return { ...route, pickupPoints: points };
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
    const points = await db_1.db
        .select({
        id: schema_1.routePickupPoints.id,
        stopOrder: schema_1.routePickupPoints.stopOrder,
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
    (0, response_1.SuccessResponse)(res, { route: { ...route[0], pickupPoints: points } }, 200);
};
exports.getRouteById = getRouteById;
// ✅ Update Route
const updateRoute = async (req, res) => {
    const { id } = req.params;
    const { name, description, pickupPoints: points, status } = req.body;
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
    // ✅ Update - ده شغال عادي
    await db_1.db
        .update(schema_1.Rout)
        .set({
        name: name ?? existingRoute[0].name,
        description: description !== undefined ? description : existingRoute[0].description,
        status: status ?? existingRoute[0].status,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.Rout.id, id));
    if (points !== undefined) {
        await db_1.db.delete(schema_1.routePickupPoints).where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, id));
        if (points.length > 0) {
            const pickupPointIds = points.map((p) => p.pickupPointId);
            const uniqueIds = [...new Set(pickupPointIds)];
            if (uniqueIds.length !== pickupPointIds.length) {
                throw new BadRequest_1.BadRequest("Duplicate pickup points not allowed");
            }
            const stopOrders = points.map((p) => p.stopOrder);
            const uniqueOrders = [...new Set(stopOrders)];
            if (uniqueOrders.length !== stopOrders.length) {
                throw new BadRequest_1.BadRequest("Duplicate stop orders not allowed");
            }
            const existingPoints = await db_1.db
                .select()
                .from(schema_1.pickupPoints)
                .where((0, drizzle_orm_1.inArray)(schema_1.pickupPoints.id, pickupPointIds));
            if (existingPoints.length !== pickupPointIds.length) {
                throw new BadRequest_1.BadRequest("One or more pickup points not found");
            }
            // ✅ Raw SQL للـ INSERT
            for (const point of points) {
                await db_1.db.execute((0, drizzle_orm_1.sql) `INSERT INTO route_pickup_points (id, route_id, pickup_point_id, stop_order) 
              VALUES (${(0, uuid_1.v4)()}, ${id}, ${point.pickupPointId}, ${point.stopOrder})`);
            }
        }
    }
    const [updatedRoute] = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.eq)(schema_1.Rout.id, id))
        .limit(1);
    const updatedPoints = await db_1.db
        .select({
        id: schema_1.routePickupPoints.id,
        stopOrder: schema_1.routePickupPoints.stopOrder,
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
        message: "Route updated successfully",
        route: { ...updatedRoute, pickupPoints: updatedPoints },
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
    await db_1.db.delete(schema_1.routePickupPoints).where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, id));
    await db_1.db.delete(schema_1.Rout).where((0, drizzle_orm_1.eq)(schema_1.Rout.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Route deleted successfully" }, 200);
};
exports.deleteRoute = deleteRoute;
const getAllPickupPoints = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allPoints = await db_1.db
        .select()
        .from(schema_1.pickupPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { message: "All pickup points", pickupPoints: allPoints }, 200);
};
exports.getAllPickupPoints = getAllPickupPoints;
