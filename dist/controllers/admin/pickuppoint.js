// src/controllers/admin/pickupPointController.ts
import { db } from "../../models/db";
import { pickupPoints } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
// ✅ Get All Pickup Points
export const getAllPickupPoints = async (req, res) => {
    const allPoints = await db.select().from(pickupPoints);
    SuccessResponse(res, { pickupPoints: allPoints }, 200);
};
// ✅ Get Pickup Point By ID
export const getPickupPointById = async (req, res) => {
    const { id } = req.params;
    const point = await db
        .select()
        .from(pickupPoints)
        .where(eq(pickupPoints.id, id))
        .limit(1);
    if (!point[0]) {
        throw new NotFound("Pickup Point not found");
    }
    SuccessResponse(res, { pickupPoint: point[0] }, 200);
};
// ✅ Create Pickup Point
export const createPickupPoint = async (req, res) => {
    const { name, address, lat, lng } = req.body;
    const organizationId = req.user?.organizationId;
    // ✅ تحقق إن الـ organizationId موجود
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    if (!name || !lat || !lng) {
        throw new BadRequest("name, lat, and lng are required");
    }
    await db.insert(pickupPoints).values({
        organizationId,
        name,
        address: address || null,
        lat,
        lng,
    });
    SuccessResponse(res, { message: "Pickup Point created successfully" }, 201);
};
// ✅ Update Pickup Point
export const updatePickupPoint = async (req, res) => {
    const { id } = req.params;
    const { name, address, lat, lng, status } = req.body;
    const existingPoint = await db
        .select()
        .from(pickupPoints)
        .where(eq(pickupPoints.id, id))
        .limit(1);
    if (!existingPoint[0]) {
        throw new NotFound("Pickup Point not found");
    }
    await db
        .update(pickupPoints)
        .set({
        name: name || existingPoint[0].name,
        address: address !== undefined ? address : existingPoint[0].address,
        lat: lat || existingPoint[0].lat,
        lng: lng || existingPoint[0].lng,
        status: status || existingPoint[0].status,
    })
        .where(eq(pickupPoints.id, id));
    SuccessResponse(res, { message: "Pickup Point updated successfully" }, 200);
};
// ✅ Delete Pickup Point
export const deletePickupPoint = async (req, res) => {
    const { id } = req.params;
    const existingPoint = await db
        .select()
        .from(pickupPoints)
        .where(eq(pickupPoints.id, id))
        .limit(1);
    if (!existingPoint[0]) {
        throw new NotFound("Pickup Point not found");
    }
    await db.delete(pickupPoints).where(eq(pickupPoints.id, id));
    SuccessResponse(res, { message: "Pickup Point deleted successfully" }, 200);
};
// ✅ Toggle Status
export const togglePickupPointStatus = async (req, res) => {
    const { id } = req.params;
    const existingPoint = await db
        .select()
        .from(pickupPoints)
        .where(eq(pickupPoints.id, id))
        .limit(1);
    if (!existingPoint[0]) {
        throw new NotFound("Pickup Point not found");
    }
    const newStatus = existingPoint[0].status === "active" ? "inactive" : "active";
    await db.update(pickupPoints).set({ status: newStatus }).where(eq(pickupPoints.id, id));
    SuccessResponse(res, { message: `Pickup Point ${newStatus}` }, 200);
};
//# sourceMappingURL=pickuppoint.js.map