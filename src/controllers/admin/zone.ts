// src/controllers/admin/zoneController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { zones, cities } from "../../models/schema";
import { eq, desc, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";

// ✅ Create Zone
export const createZone = async (req: Request, res: Response) => {
  const { name, cityId, cost } = req.body;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!name) throw new BadRequest("name is required");
  if (!cityId) throw new BadRequest("cityId is required");
  if (cost === undefined) throw new BadRequest("cost is required");

  // تحقق من وجود المدينة
  const city = await db
    .select()
    .from(cities)
    .where(and(eq(cities.id, cityId), eq(cities.organizationId, organizationId)))
    .limit(1);

  if (city.length === 0) {
    throw new NotFound("City not found");
  }

  await db.insert(zones).values({ organizationId, name, cityId, cost });

  return SuccessResponse(res, { message: "Zone created successfully" }, 201);
};

// ✅ Get All Zones
export const getZones = async (req: Request, res: Response) => {
  const { cityId } = req.query;
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  // Build where conditions
  const conditions = [eq(zones.organizationId, organizationId)];
  if (cityId && typeof cityId === "string") {
    conditions.push(eq(zones.cityId, cityId));
  }

  const zoneList = await db
    .select({
      id: zones.id,
      name: zones.name,
      cost: zones.cost,
      createdAt: zones.createdAt,
      city: {
        id: cities.id,
        name: cities.name,
      },
    })
    .from(zones)
    .leftJoin(cities, eq(zones.cityId, cities.id))
    .where(and(...conditions))
    .orderBy(desc(zones.createdAt));

  return SuccessResponse(res, { zones: zoneList }, 200);
};

// ✅ Get Zone By ID
export const getZoneById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }
  const zone = await db
    .select({
      id: zones.id,
      name: zones.name,
      cost: zones.cost,
      createdAt: zones.createdAt,
      city: {
        id: cities.id,
        name: cities.name,
      },
    })
    .from(zones)
    .leftJoin(cities, eq(zones.cityId, cities.id))
    .where(and(eq(zones.id, id), eq(zones.organizationId, organizationId)))
    .limit(1);

  if (zone.length === 0) {
    throw new NotFound("Zone not found");
  }

  return SuccessResponse(res, { zone: zone[0] }, 200);
};

// ✅ Update Zone
export const updateZone = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, cityId, cost } = req.body;
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }
  const zone = await db
    .select()
    .from(zones)
    .where(and(eq(zones.id, id), eq(zones.organizationId, organizationId)))
    .limit(1);

  if (zone.length === 0) {
    throw new NotFound("Zone not found");
  }

  // لو بيغير المدينة، تحقق من وجودها
  if (cityId) {
    const city = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (city.length === 0) {
      throw new NotFound("City not found");
    }
  }

  await db
    .update(zones)
    .set({
      name: name || zone[0].name,
      cityId: cityId || zone[0].cityId,
      cost: cost !== undefined ? cost : zone[0].cost,
    })
    .where(eq(zones.id, id));

  return SuccessResponse(res, { message: "Zone updated successfully" }, 200);
};

// ✅ Delete Zone
export const deleteZone = async (req: Request, res: Response) => {
  const { id } = req.params;

  const zone = await db
    .select()
    .from(zones)
    .where(eq(zones.id, id))
    .limit(1);

  if (zone.length === 0) {
    throw new NotFound("Zone not found");
  }

  await db.delete(zones).where(eq(zones.id, id));

  return SuccessResponse(res, { message: "Zone deleted successfully" }, 200);
};


