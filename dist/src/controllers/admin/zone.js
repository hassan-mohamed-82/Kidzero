"use strict";
// src/controllers/admin/zoneController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteZone = exports.updateZone = exports.getZoneById = exports.getZones = exports.createZone = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
// ✅ Create Zone
const createZone = async (req, res) => {
    const { name, cityId, cost } = req.body;
    if (!name)
        throw new BadRequest_1.BadRequest("name is required");
    if (!cityId)
        throw new BadRequest_1.BadRequest("cityId is required");
    if (cost === undefined)
        throw new BadRequest_1.BadRequest("cost is required");
    // تحقق من وجود المدينة
    const city = await db_1.db
        .select()
        .from(schema_1.cities)
        .where((0, drizzle_orm_1.eq)(schema_1.cities.id, cityId))
        .limit(1);
    if (city.length === 0) {
        throw new NotFound_1.NotFound("City not found");
    }
    await db_1.db.insert(schema_1.zones).values({ name, cityId, cost });
    return (0, response_1.SuccessResponse)(res, { message: "Zone created successfully" }, 201);
};
exports.createZone = createZone;
// ✅ Get All Zones
const getZones = async (req, res) => {
    const { cityId } = req.query;
    let query = db_1.db
        .select({
        id: schema_1.zones.id,
        name: schema_1.zones.name,
        cost: schema_1.zones.cost,
        createdAt: schema_1.zones.createdAt,
        city: {
            id: schema_1.cities.id,
            name: schema_1.cities.name,
        },
    })
        .from(schema_1.zones)
        .leftJoin(schema_1.cities, (0, drizzle_orm_1.eq)(schema_1.zones.cityId, schema_1.cities.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.zones.createdAt));
    // فلتر حسب المدينة
    if (cityId && typeof cityId === "string") {
        query = query.where((0, drizzle_orm_1.eq)(schema_1.zones.cityId, cityId));
    }
    const zoneList = await query;
    return (0, response_1.SuccessResponse)(res, { zones: zoneList }, 200);
};
exports.getZones = getZones;
// ✅ Get Zone By ID
const getZoneById = async (req, res) => {
    const { id } = req.params;
    const zone = await db_1.db
        .select({
        id: schema_1.zones.id,
        name: schema_1.zones.name,
        cost: schema_1.zones.cost,
        createdAt: schema_1.zones.createdAt,
        city: {
            id: schema_1.cities.id,
            name: schema_1.cities.name,
        },
    })
        .from(schema_1.zones)
        .leftJoin(schema_1.cities, (0, drizzle_orm_1.eq)(schema_1.zones.cityId, schema_1.cities.id))
        .where((0, drizzle_orm_1.eq)(schema_1.zones.id, id))
        .limit(1);
    if (zone.length === 0) {
        throw new NotFound_1.NotFound("Zone not found");
    }
    return (0, response_1.SuccessResponse)(res, { zone: zone[0] }, 200);
};
exports.getZoneById = getZoneById;
// ✅ Update Zone
const updateZone = async (req, res) => {
    const { id } = req.params;
    const { name, cityId, cost } = req.body;
    const zone = await db_1.db
        .select()
        .from(schema_1.zones)
        .where((0, drizzle_orm_1.eq)(schema_1.zones.id, id))
        .limit(1);
    if (zone.length === 0) {
        throw new NotFound_1.NotFound("Zone not found");
    }
    // لو بيغير المدينة، تحقق من وجودها
    if (cityId) {
        const city = await db_1.db
            .select()
            .from(schema_1.cities)
            .where((0, drizzle_orm_1.eq)(schema_1.cities.id, cityId))
            .limit(1);
        if (city.length === 0) {
            throw new NotFound_1.NotFound("City not found");
        }
    }
    await db_1.db
        .update(schema_1.zones)
        .set({
        name: name || zone[0].name,
        cityId: cityId || zone[0].cityId,
        cost: cost !== undefined ? cost : zone[0].cost,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.zones.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Zone updated successfully" }, 200);
};
exports.updateZone = updateZone;
// ✅ Delete Zone
const deleteZone = async (req, res) => {
    const { id } = req.params;
    const zone = await db_1.db
        .select()
        .from(schema_1.zones)
        .where((0, drizzle_orm_1.eq)(schema_1.zones.id, id))
        .limit(1);
    if (zone.length === 0) {
        throw new NotFound_1.NotFound("Zone not found");
    }
    await db_1.db.delete(schema_1.zones).where((0, drizzle_orm_1.eq)(schema_1.zones.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Zone deleted successfully" }, 200);
};
exports.deleteZone = deleteZone;
