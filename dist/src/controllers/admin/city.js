"use strict";
// src/controllers/admin/cityController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCityWithZones = exports.getCitiesWithZones = exports.deleteCity = exports.updateCity = exports.getCityById = exports.getCities = exports.createCity = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
// ✅ Create City
const createCity = async (req, res) => {
    const { name } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!name) {
        throw new BadRequest_1.BadRequest("name is required");
    }
    await db_1.db.insert(schema_1.cities).values({ organizationId, name });
    return (0, response_1.SuccessResponse)(res, { message: "City created successfully" }, 201);
};
exports.createCity = createCity;
// ✅ Get All Cities
const getCities = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const cityList = await db_1.db
        .select()
        .from(schema_1.cities)
        .where((0, drizzle_orm_1.eq)(schema_1.cities.organizationId, organizationId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.cities.createdAt)); // ✅ desc() كـ function
    return (0, response_1.SuccessResponse)(res, { cities: cityList }, 200);
};
exports.getCities = getCities;
// ✅ Get City By ID
const getCityById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const city = await db_1.db
        .select()
        .from(schema_1.cities)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cities.id, id), (0, drizzle_orm_1.eq)(schema_1.cities.organizationId, organizationId)))
        .limit(1); // ✅ بدل .first()
    if (city.length === 0) {
        throw new NotFound_1.NotFound("City not found");
    }
    return (0, response_1.SuccessResponse)(res, { city: city[0] }, 200);
};
exports.getCityById = getCityById;
// ✅ Update City
const updateCity = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const city = await db_1.db
        .select()
        .from(schema_1.cities)
        .where((0, drizzle_orm_1.eq)(schema_1.cities.id, id))
        .limit(1);
    if (city.length === 0) {
        throw new NotFound_1.NotFound("City not found");
    }
    await db_1.db
        .update(schema_1.cities)
        .set({ name: name || city[0].name })
        .where((0, drizzle_orm_1.eq)(schema_1.cities.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "City updated successfully" }, 200);
};
exports.updateCity = updateCity;
// ✅ Delete City
const deleteCity = async (req, res) => {
    const { id } = req.params;
    const city = await db_1.db
        .select()
        .from(schema_1.cities)
        .where((0, drizzle_orm_1.eq)(schema_1.cities.id, id))
        .limit(1);
    if (city.length === 0) {
        throw new NotFound_1.NotFound("City not found");
    }
    await db_1.db.delete(schema_1.cities).where((0, drizzle_orm_1.eq)(schema_1.cities.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "City deleted successfully" }, 200);
};
exports.deleteCity = deleteCity;
// أضف في cityController.ts
// ✅ Get All Cities With Zones
const getCitiesWithZones = async (req, res) => {
    // جلب كل المدن
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const cityList = await db_1.db
        .select()
        .from(schema_1.cities)
        .where((0, drizzle_orm_1.eq)(schema_1.cities.organizationId, organizationId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.cities.createdAt));
    // جلب كل المناطق
    const zoneList = await db_1.db
        .select({
        id: schema_1.zones.id,
        name: schema_1.zones.name,
        cost: schema_1.zones.cost,
        cityId: schema_1.zones.cityId,
    })
        .from(schema_1.zones)
        .where((0, drizzle_orm_1.eq)(schema_1.zones.organizationId, organizationId))
        .orderBy(schema_1.zones.name);
    // تجميع المناطق مع المدن
    const citiesWithZones = cityList.map((city) => ({
        id: city.id,
        name: city.name,
        createdAt: city.createdAt,
        zones: zoneList.filter((zone) => zone.cityId === city.id),
        zonesCount: zoneList.filter((zone) => zone.cityId === city.id).length,
    }));
    return (0, response_1.SuccessResponse)(res, {
        cities: citiesWithZones,
        totalCities: cityList.length,
        totalZones: zoneList.length,
    }, 200);
};
exports.getCitiesWithZones = getCitiesWithZones;
// ✅ Get Single City With Zones
const getCityWithZones = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const city = await db_1.db
        .select()
        .from(schema_1.cities)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cities.id, id), (0, drizzle_orm_1.eq)(schema_1.cities.organizationId, organizationId)))
        .limit(1);
    if (city.length === 0) {
        throw new NotFound_1.NotFound("City not found");
    }
    const cityZones = await db_1.db
        .select({
        id: schema_1.zones.id,
        name: schema_1.zones.name,
        cost: schema_1.zones.cost,
        createdAt: schema_1.zones.createdAt,
    })
        .from(schema_1.zones)
        .where((0, drizzle_orm_1.eq)(schema_1.zones.cityId, id))
        .orderBy(schema_1.zones.name);
    return (0, response_1.SuccessResponse)(res, {
        city: {
            ...city[0],
            zones: cityZones,
            zonesCount: cityZones.length,
        },
    }, 200);
};
exports.getCityWithZones = getCityWithZones;
