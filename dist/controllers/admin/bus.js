// src/controllers/admin/busController.ts
import { db } from "../../models/db";
import { buses, busTypes } from "../../models/schema";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
// ✅ Get All Buses
export const getAllBuses = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const allBuses = await db
        .select({
        id: buses.id,
        busNumber: buses.busNumber,
        plateNumber: buses.plateNumber,
        model: buses.model,
        color: buses.color,
        year: buses.year,
        status: buses.status,
        createdAt: buses.createdAt,
        updatedAt: buses.updatedAt,
        busType: {
            id: busTypes.id,
            name: busTypes.name,
            capacity: busTypes.capacity,
        },
    })
        .from(buses)
        .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
        .where(eq(buses.organizationId, organizationId));
    SuccessResponse(res, { buses: allBuses }, 200);
};
// ✅ Get Bus By ID
export const getBusById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const bus = await db
        .select({
        id: buses.id,
        busNumber: buses.busNumber,
        plateNumber: buses.plateNumber,
        model: buses.model,
        color: buses.color,
        year: buses.year,
        status: buses.status,
        createdAt: buses.createdAt,
        updatedAt: buses.updatedAt,
        busType: {
            id: busTypes.id,
            name: busTypes.name,
            capacity: busTypes.capacity,
            description: busTypes.description,
        },
    })
        .from(buses)
        .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
        .where(and(eq(buses.id, id), eq(buses.organizationId, organizationId)))
        .limit(1);
    if (!bus[0]) {
        throw new NotFound("Bus not found");
    }
    SuccessResponse(res, { bus: bus[0] }, 200);
};
// ✅ Create Bus
export const createBus = async (req, res) => {
    const { busTypeId, busNumber, plateNumber, model, color, year } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    console.log("busTypeId:", busTypeId); // 👈 أضف ده للـ Debug
    console.log("organizationId:", organizationId); // 👈 أضف ده للـ Debug
    // تحقق من وجود الـ Bus Type
    const busType = await db
        .select()
        .from(busTypes)
        .where(eq(busTypes.id, busTypeId))
        .limit(1);
    console.log("busType found:", busType); // 👈 أضف ده
    if (!busType[0]) {
        throw new BadRequest("Bus Type not found");
    }
    // تحقق من عدم تكرار رقم اللوحة
    const existingPlate = await db
        .select()
        .from(buses)
        .where(eq(buses.plateNumber, plateNumber))
        .limit(1);
    if (existingPlate[0]) {
        throw new BadRequest("Plate Number already exists");
    }
    // تحقق من عدم تكرار رقم الباص في نفس الـ Organization
    const existingBusNumber = await db
        .select()
        .from(buses)
        .where(and(eq(buses.busNumber, busNumber), eq(buses.organizationId, organizationId)))
        .limit(1);
    if (existingBusNumber[0]) {
        throw new BadRequest("Bus Number already exists in this organization");
    }
    await db.insert(buses).values({
        organizationId,
        busTypeId,
        busNumber,
        plateNumber,
        model: model || null,
        color: color || null,
        year: year || null,
    });
    SuccessResponse(res, { message: "Bus created successfully" }, 201);
};
// ✅ Update Bus
export const updateBus = async (req, res) => {
    const { id } = req.params;
    const { busTypeId, busNumber, plateNumber, model, color, year, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    // تحقق من وجود الباص
    const existingBus = await db
        .select()
        .from(buses)
        .where(and(eq(buses.id, id), eq(buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound("Bus not found");
    }
    // لو بيغير الـ Bus Type، نتحقق إنه موجود
    if (busTypeId && busTypeId !== existingBus[0].busTypeId) {
        const busType = await db
            .select()
            .from(busTypes)
            .where(eq(busTypes.id, busTypeId))
            .limit(1);
        if (!busType[0]) {
            throw new BadRequest("Bus Type not found");
        }
    }
    // لو بيغير رقم اللوحة، نتحقق إنه مش مكرر
    if (plateNumber && plateNumber !== existingBus[0].plateNumber) {
        const existingPlate = await db
            .select()
            .from(buses)
            .where(eq(buses.plateNumber, plateNumber))
            .limit(1);
        if (existingPlate[0]) {
            throw new BadRequest("Plate Number already exists");
        }
    }
    // لو بيغير رقم الباص، نتحقق إنه مش مكرر في نفس الـ Organization
    if (busNumber && busNumber !== existingBus[0].busNumber) {
        const existingBusNumber = await db
            .select()
            .from(buses)
            .where(and(eq(buses.busNumber, busNumber), eq(buses.organizationId, organizationId)))
            .limit(1);
        if (existingBusNumber[0]) {
            throw new BadRequest("Bus Number already exists in this organization");
        }
    }
    await db
        .update(buses)
        .set({
        busTypeId: busTypeId ?? existingBus[0].busTypeId,
        busNumber: busNumber ?? existingBus[0].busNumber,
        plateNumber: plateNumber ?? existingBus[0].plateNumber,
        model: model !== undefined ? model : existingBus[0].model,
        color: color !== undefined ? color : existingBus[0].color,
        year: year !== undefined ? year : existingBus[0].year,
        status: status ?? existingBus[0].status,
    })
        .where(eq(buses.id, id));
    SuccessResponse(res, { message: "Bus updated successfully" }, 200);
};
// ✅ Delete Bus
export const deleteBus = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const existingBus = await db
        .select()
        .from(buses)
        .where(and(eq(buses.id, id), eq(buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound("Bus not found");
    }
    // TODO: تحقق إن الباص مش مرتبط برحلات قبل الحذف
    await db.delete(buses).where(eq(buses.id, id));
    SuccessResponse(res, { message: "Bus deleted successfully" }, 200);
};
// ✅ Update Bus Status
export const updateBusStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    if (!["active", "inactive", "maintenance"].includes(status)) {
        throw new BadRequest("Invalid status. Must be: active, inactive, or maintenance");
    }
    const existingBus = await db
        .select()
        .from(buses)
        .where(and(eq(buses.id, id), eq(buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound("Bus not found");
    }
    await db.update(buses).set({ status }).where(eq(buses.id, id));
    SuccessResponse(res, { message: `Bus status updated to ${status}` }, 200);
};
// ✅ Get Buses By Status
export const getBusesByStatus = async (req, res) => {
    const { status } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    if (!["active", "inactive", "maintenance"].includes(status)) {
        throw new BadRequest("Invalid status");
    }
    const filteredBuses = await db
        .select({
        id: buses.id,
        busNumber: buses.busNumber,
        plateNumber: buses.plateNumber,
        model: buses.model,
        color: buses.color,
        status: buses.status,
        busType: {
            id: busTypes.id,
            name: busTypes.name,
            capacity: busTypes.capacity,
        },
    })
        .from(buses)
        .leftJoin(busTypes, eq(buses.busTypeId, busTypes.id))
        .where(and(eq(buses.organizationId, organizationId), eq(buses.status, status)));
    SuccessResponse(res, { buses: filteredBuses }, 200);
};
//# sourceMappingURL=bus.js.map