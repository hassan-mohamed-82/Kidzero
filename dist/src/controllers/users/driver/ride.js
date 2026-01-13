"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRides = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const BadRequest_1 = require("../../../Errors/BadRequest");
const schema_2 = require("../../../models/schema");
const getAllRides = async (req, res) => {
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Invalid driver id");
    }
    const driver = await db_1.db.query.drivers.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_2.drivers.id, driverId)
    });
    if (!driver) {
        throw new BadRequest_1.BadRequest("Invalid driver id");
    }
    const DriverRides = await db_1.db.select().from(schema_1.rides).where((0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId));
    (0, response_1.SuccessResponse)(res, { DriverRides }, 200);
};
exports.getAllRides = getAllRides;
