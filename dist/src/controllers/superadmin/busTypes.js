"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBusType = exports.updateBusType = exports.createBusType = exports.getBusTypeById = exports.getAllBusTypes = void 0;
const BadRequest_1 = require("../../Errors/BadRequest");
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Bustype_1 = require("../../models/superadmin/Bustype");
const schema_1 = require("../../models/schema");
const getAllBusTypes = async (req, res) => {
    const busTypes = await db_1.db.query.busTypes.findMany();
    return (0, response_1.SuccessResponse)(res, { busTypes }, 200);
};
exports.getAllBusTypes = getAllBusTypes;
const getBusTypeById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Bus Type Id");
    }
    const busType = await db_1.db.query.busTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(Bustype_1.busTypes.id, Id)
    });
    if (!busType) {
        throw new BadRequest_1.BadRequest("Bus Type not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Bus Type retrieved successfully", busType }, 200);
};
exports.getBusTypeById = getBusTypeById;
const createBusType = async (req, res) => {
    const { name, capacity, description } = req.body;
    if (!name || !capacity) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    const newBusType = await db_1.db.insert(Bustype_1.busTypes).values({
        name,
        capacity,
        description
    });
    return (0, response_1.SuccessResponse)(res, { message: "Bus Type created successfully" }, 201);
};
exports.createBusType = createBusType;
const updateBusType = async (req, res) => {
    const { Id } = req.params;
    const { name, capacity, description, status } = req.body;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Bus Type Id");
    }
    const existingBusType = await db_1.db.query.busTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(Bustype_1.busTypes.id, Id)
    });
    if (!existingBusType) {
        throw new BadRequest_1.BadRequest("Bus Type not found");
    }
    await db_1.db.update(Bustype_1.busTypes).set({
        name: name || existingBusType.name,
        capacity: capacity || existingBusType.capacity,
        description: description || existingBusType.description,
        status: status || existingBusType.status,
    }).where((0, drizzle_orm_1.eq)(Bustype_1.busTypes.id, Id));
    return (0, response_1.SuccessResponse)(res, { message: "Bus Type updated successfully" }, 200);
};
exports.updateBusType = updateBusType;
const deleteBusType = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Bus Type Id");
    }
    const existingBusType = await db_1.db.query.busTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(Bustype_1.busTypes.id, Id)
    });
    if (!existingBusType) {
        throw new BadRequest_1.BadRequest("Bus Type not found");
    }
    // Deleting a Bus Type that is associated with existing Buses should be prevented
    const Buses = await db_1.db.query.buses.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, Id)
    });
    if (Buses.length > 0) {
        throw new BadRequest_1.BadRequest("Cannot delete Bus Type associated with existing Buses");
    }
    await db_1.db.delete(Bustype_1.busTypes).where((0, drizzle_orm_1.eq)(Bustype_1.busTypes.id, Id));
    return (0, response_1.SuccessResponse)(res, { message: "Bus Type deleted successfully" }, 200);
};
exports.deleteBusType = deleteBusType;
