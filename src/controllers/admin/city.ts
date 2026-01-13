// src/controllers/admin/cityController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { cities, zones } from "../../models/schema";
import { eq, desc } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";

// ✅ Create City
export const createCity = async (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name) {
    throw new BadRequest("name is required");
  }
  
  await db.insert(cities).values({ name });
  
  return SuccessResponse(res, { message: "City created successfully" }, 201);
};

// ✅ Get All Cities
export const getCities = async (req: Request, res: Response) => {
  const cityList = await db
    .select()
    .from(cities)
    .orderBy(desc(cities.createdAt)); // ✅ desc() كـ function
  
  return SuccessResponse(res, { cities: cityList }, 200);
};

// ✅ Get City By ID
export const getCityById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const city = await db
    .select()
    .from(cities)
    .where(eq(cities.id, id))
    .limit(1); // ✅ بدل .first()
  
  if (city.length === 0) {
    throw new NotFound("City not found");
  }
  
  return SuccessResponse(res, { city: city[0] }, 200);
};

// ✅ Update City
export const updateCity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  
  const city = await db
    .select()
    .from(cities)
    .where(eq(cities.id, id))
    .limit(1);
  
  if (city.length === 0) {
    throw new NotFound("City not found");
  }
  
  await db
    .update(cities)
    .set({ name: name || city[0].name })
    .where(eq(cities.id, id));
  
  return SuccessResponse(res, { message: "City updated successfully" }, 200);
};

// ✅ Delete City
export const deleteCity = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const city = await db
    .select()
    .from(cities)
    .where(eq(cities.id, id))
    .limit(1);
  
  if (city.length === 0) {
    throw new NotFound("City not found");
  }
  
  await db.delete(cities).where(eq(cities.id, id));
  
  return SuccessResponse(res, { message: "City deleted successfully" }, 200);
};


// أضف في cityController.ts

// ✅ Get All Cities With Zones
export const getCitiesWithZones = async (req: Request, res: Response) => {
  // جلب كل المدن
  const cityList = await db
    .select()
    .from(cities)
    .orderBy(desc(cities.createdAt));

  // جلب كل المناطق
  const zoneList = await db
    .select({
      id: zones.id,
      name: zones.name,
      cost: zones.cost,
      cityId: zones.cityId,
    })
    .from(zones)
    .orderBy(zones.name);

  // تجميع المناطق مع المدن
  const citiesWithZones = cityList.map((city) => ({
    id: city.id,
    name: city.name,
    createdAt: city.createdAt,
    zones: zoneList.filter((zone) => zone.cityId === city.id),
    zonesCount: zoneList.filter((zone) => zone.cityId === city.id).length,
  }));

  return SuccessResponse(res, { 
    cities: citiesWithZones,
    totalCities: cityList.length,
    totalZones: zoneList.length,
  }, 200);
};

// ✅ Get Single City With Zones
export const getCityWithZones = async (req: Request, res: Response) => {
  const { id } = req.params;

  const city = await db
    .select()
    .from(cities)
    .where(eq(cities.id, id))
    .limit(1);

  if (city.length === 0) {
    throw new NotFound("City not found");
  }

  const cityZones = await db
    .select({
      id: zones.id,
      name: zones.name,
      cost: zones.cost,
      createdAt: zones.createdAt,
    })
    .from(zones)
    .where(eq(zones.cityId, id))
    .orderBy(zones.name);

  return SuccessResponse(res, {
    city: {
      ...city[0],
      zones: cityZones,
      zonesCount: cityZones.length,
    },
  }, 200);
};
