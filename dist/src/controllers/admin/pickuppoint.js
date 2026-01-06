"use strict";
// src/controllers/admin/pickupPointController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePickupPointStatus = exports.deletePickupPoint = exports.updatePickupPoint = exports.createPickupPoint = exports.getPickupPointById = exports.getAllPickupPoints = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
// ✅ Get All Pickup Points
const getAllPickupPoints = async (req, res) => {
    const allPoints = await db_1.db.select().from(schema_1.pickupPoints);
    (0, response_1.SuccessResponse)(res, { pickupPoints: allPoints }, 200);
};
exports.getAllPickupPoints = getAllPickupPoints;
// ✅ Get Pickup Point By ID
const getPickupPointById = async (req, res) => {
    const { id } = req.params;
    const point = await db_1.db
        .select()
        .from(schema_1.pickupPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, id))
        .limit(1);
    if (!point[0]) {
        throw new NotFound_1.NotFound("Pickup Point not found");
    }
    (0, response_1.SuccessResponse)(res, { pickupPoint: point[0] }, 200);
};
exports.getPickupPointById = getPickupPointById;
// ✅ Create Pickup Point
const createPickupPoint = async (req, res) => {
    const { name, address, lat, lng } = req.body;
    const organizationId = req.user?.organizationId;
    // ✅ تحقق إن الـ organizationId موجود
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!name || !lat || !lng) {
        throw new BadRequest_1.BadRequest("name, lat, and lng are required");
    }
    await db_1.db.insert(schema_1.pickupPoints).values({
        organizationId,
        name,
        address: address || null,
        lat,
        lng,
    });
    (0, response_1.SuccessResponse)(res, { message: "Pickup Point created successfully" }, 201);
};
exports.createPickupPoint = createPickupPoint;
// ✅ Update Pickup Point
const updatePickupPoint = async (req, res) => {
    const { id } = req.params;
    const { name, address, lat, lng, status } = req.body;
    const existingPoint = await db_1.db
        .select()
        .from(schema_1.pickupPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, id))
        .limit(1);
    if (!existingPoint[0]) {
        throw new NotFound_1.NotFound("Pickup Point not found");
    }
    await db_1.db
        .update(schema_1.pickupPoints)
        .set({
        name: name || existingPoint[0].name,
        address: address !== undefined ? address : existingPoint[0].address,
        lat: lat || existingPoint[0].lat,
        lng: lng || existingPoint[0].lng,
        status: status || existingPoint[0].status,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Pickup Point updated successfully" }, 200);
};
exports.updatePickupPoint = updatePickupPoint;
// ✅ Delete Pickup Point
const deletePickupPoint = async (req, res) => {
    const { id } = req.params;
    const existingPoint = await db_1.db
        .select()
        .from(schema_1.pickupPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, id))
        .limit(1);
    if (!existingPoint[0]) {
        throw new NotFound_1.NotFound("Pickup Point not found");
    }
    await db_1.db.delete(schema_1.pickupPoints).where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Pickup Point deleted successfully" }, 200);
};
exports.deletePickupPoint = deletePickupPoint;
// ✅ Toggle Status
const togglePickupPointStatus = async (req, res) => {
    const { id } = req.params;
    const existingPoint = await db_1.db
        .select()
        .from(schema_1.pickupPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, id))
        .limit(1);
    if (!existingPoint[0]) {
        throw new NotFound_1.NotFound("Pickup Point not found");
    }
    const newStatus = existingPoint[0].status === "active" ? "inactive" : "active";
    await db_1.db.update(schema_1.pickupPoints).set({ status: newStatus }).where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, id));
    (0, response_1.SuccessResponse)(res, { message: `Pickup Point ${newStatus}` }, 200);
};
exports.togglePickupPointStatus = togglePickupPointStatus;
