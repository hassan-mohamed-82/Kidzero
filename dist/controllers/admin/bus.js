"use strict";
// src/controllers/admin/busController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusesByStatus = exports.updateBusStatus = exports.deleteBus = exports.updateBus = exports.createBus = exports.getBusById = exports.getAllBuses = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
// ✅ Get All Buses
const getAllBuses = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allBuses = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        model: schema_1.buses.model,
        color: schema_1.buses.color,
        year: schema_1.buses.year,
        status: schema_1.buses.status,
        createdAt: schema_1.buses.createdAt,
        updatedAt: schema_1.buses.updatedAt,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { buses: allBuses }, 200);
};
exports.getAllBuses = getAllBuses;
// ✅ Get Bus By ID
const getBusById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const bus = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        model: schema_1.buses.model,
        color: schema_1.buses.color,
        year: schema_1.buses.year,
        status: schema_1.buses.status,
        createdAt: schema_1.buses.createdAt,
        updatedAt: schema_1.buses.updatedAt,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
            description: schema_1.busTypes.description,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!bus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    (0, response_1.SuccessResponse)(res, { bus: bus[0] }, 200);
};
exports.getBusById = getBusById;
// ✅ Create Bus
const createBus = async (req, res) => {
    const { busTypeId, busNumber, plateNumber, model, color, year } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    console.log("busTypeId:", busTypeId); // 👈 أضف ده للـ Debug
    console.log("organizationId:", organizationId); // 👈 أضف ده للـ Debug
    // تحقق من وجود الـ Bus Type
    const busType = await db_1.db
        .select()
        .from(schema_1.busTypes)
        .where((0, drizzle_orm_1.eq)(schema_1.busTypes.id, busTypeId))
        .limit(1);
    console.log("busType found:", busType); // 👈 أضف ده
    if (!busType[0]) {
        throw new BadRequest_1.BadRequest("Bus Type not found");
    }
    // تحقق من عدم تكرار رقم اللوحة
    const existingPlate = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.eq)(schema_1.buses.plateNumber, plateNumber))
        .limit(1);
    if (existingPlate[0]) {
        throw new BadRequest_1.BadRequest("Plate Number already exists");
    }
    // تحقق من عدم تكرار رقم الباص في نفس الـ Organization
    const existingBusNumber = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.busNumber, busNumber), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (existingBusNumber[0]) {
        throw new BadRequest_1.BadRequest("Bus Number already exists in this organization");
    }
    await db_1.db.insert(schema_1.buses).values({
        organizationId,
        busTypeId,
        busNumber,
        plateNumber,
        model: model || null,
        color: color || null,
        year: year || null,
    });
    (0, response_1.SuccessResponse)(res, { message: "Bus created successfully" }, 201);
};
exports.createBus = createBus;
// ✅ Update Bus
const updateBus = async (req, res) => {
    const { id } = req.params;
    const { busTypeId, busNumber, plateNumber, model, color, year, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // تحقق من وجود الباص
    const existingBus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    // لو بيغير الـ Bus Type، نتحقق إنه موجود
    if (busTypeId && busTypeId !== existingBus[0].busTypeId) {
        const busType = await db_1.db
            .select()
            .from(schema_1.busTypes)
            .where((0, drizzle_orm_1.eq)(schema_1.busTypes.id, busTypeId))
            .limit(1);
        if (!busType[0]) {
            throw new BadRequest_1.BadRequest("Bus Type not found");
        }
    }
    // لو بيغير رقم اللوحة، نتحقق إنه مش مكرر
    if (plateNumber && plateNumber !== existingBus[0].plateNumber) {
        const existingPlate = await db_1.db
            .select()
            .from(schema_1.buses)
            .where((0, drizzle_orm_1.eq)(schema_1.buses.plateNumber, plateNumber))
            .limit(1);
        if (existingPlate[0]) {
            throw new BadRequest_1.BadRequest("Plate Number already exists");
        }
    }
    // لو بيغير رقم الباص، نتحقق إنه مش مكرر في نفس الـ Organization
    if (busNumber && busNumber !== existingBus[0].busNumber) {
        const existingBusNumber = await db_1.db
            .select()
            .from(schema_1.buses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.busNumber, busNumber), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
            .limit(1);
        if (existingBusNumber[0]) {
            throw new BadRequest_1.BadRequest("Bus Number already exists in this organization");
        }
    }
    await db_1.db
        .update(schema_1.buses)
        .set({
        busTypeId: busTypeId ?? existingBus[0].busTypeId,
        busNumber: busNumber ?? existingBus[0].busNumber,
        plateNumber: plateNumber ?? existingBus[0].plateNumber,
        model: model !== undefined ? model : existingBus[0].model,
        color: color !== undefined ? color : existingBus[0].color,
        year: year !== undefined ? year : existingBus[0].year,
        status: status ?? existingBus[0].status,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.buses.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Bus updated successfully" }, 200);
};
exports.updateBus = updateBus;
// ✅ Delete Bus
const deleteBus = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingBus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    // TODO: تحقق إن الباص مش مرتبط برحلات قبل الحذف
    await db_1.db.delete(schema_1.buses).where((0, drizzle_orm_1.eq)(schema_1.buses.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Bus deleted successfully" }, 200);
};
exports.deleteBus = deleteBus;
// ✅ Update Bus Status
const updateBusStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!["active", "inactive", "maintenance"].includes(status)) {
        throw new BadRequest_1.BadRequest("Invalid status. Must be: active, inactive, or maintenance");
    }
    const existingBus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    await db_1.db.update(schema_1.buses).set({ status }).where((0, drizzle_orm_1.eq)(schema_1.buses.id, id));
    (0, response_1.SuccessResponse)(res, { message: `Bus status updated to ${status}` }, 200);
};
exports.updateBusStatus = updateBusStatus;
// ✅ Get Buses By Status
const getBusesByStatus = async (req, res) => {
    const { status } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!["active", "inactive", "maintenance"].includes(status)) {
        throw new BadRequest_1.BadRequest("Invalid status");
    }
    const filteredBuses = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        model: schema_1.buses.model,
        color: schema_1.buses.color,
        status: schema_1.buses.status,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.buses.status, status)));
    (0, response_1.SuccessResponse)(res, { buses: filteredBuses }, 200);
};
exports.getBusesByStatus = getBusesByStatus;
