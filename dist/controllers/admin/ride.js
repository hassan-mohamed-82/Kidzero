"use strict";
// src/controllers/admin/rideController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStudentFromRide = exports.addStudentsToRide = exports.deleteRide = exports.updateRide = exports.getRideById = exports.getAllRides = exports.createRide = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const uuid_1 = require("uuid");
// ✅ Create Ride
const checkBusCapacity = async (busId, rideId, newStudentsCount) => {
    // جلب سعة الباص
    const [bus] = await db_1.db
        .select({ maxSeats: schema_1.buses.maxSeats })
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.eq)(schema_1.buses.id, busId))
        .limit(1);
    if (!bus) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    // عد الطلاب الحاليين في الـ Ride (لو موجود)
    let currentStudentsCount = 0;
    if (rideId) {
        const [result] = await db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.rideStudents)
            .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId));
        currentStudentsCount = result.count;
    }
    const totalStudents = currentStudentsCount + newStudentsCount;
    if (totalStudents > bus.maxSeats) {
        throw new BadRequest_1.BadRequest(`Bus capacity exceeded. Max: ${bus.maxSeats}, Current: ${currentStudentsCount}, Trying to add: ${newStudentsCount}, Total would be: ${totalStudents}`);
    }
};
// ✅ Create Ride
const createRide = async (req, res) => {
    const { busId, driverId, codriverId, routeId, name, rideType, frequency, repeatType, startDate, endDate, students: rideStudentsData, } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // Check bus exists
    const bus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, busId), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!bus[0])
        throw new NotFound_1.NotFound("Bus not found");
    // ✅ التحقق من سعة الباص
    await checkBusCapacity(busId, null, rideStudentsData.length);
    // Check driver exists
    const driver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, driverId), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!driver[0])
        throw new NotFound_1.NotFound("Driver not found");
    // Check codriver if provided
    if (codriverId) {
        const codriver = await db_1.db
            .select()
            .from(schema_1.codrivers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.codrivers.id, codriverId), (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId)))
            .limit(1);
        if (!codriver[0])
            throw new NotFound_1.NotFound("Codriver not found");
    }
    // Check route exists
    const route = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.id, routeId), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
        .limit(1);
    if (!route[0])
        throw new NotFound_1.NotFound("Route not found");
    // Get route pickup points
    const routePickupPointsList = await db_1.db
        .select()
        .from(schema_1.routePickupPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, routeId));
    const validPickupPointIds = routePickupPointsList.map((p) => p.pickupPointId);
    // Validate students and pickup points
    const studentIds = rideStudentsData.map((s) => s.studentId);
    // تحقق من عدم تكرار الطلاب
    const uniqueStudentIds = [...new Set(studentIds)];
    if (uniqueStudentIds.length !== studentIds.length) {
        throw new BadRequest_1.BadRequest("Duplicate students not allowed");
    }
    const existingStudents = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.students.id, studentIds), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)));
    if (existingStudents.length !== studentIds.length) {
        throw new BadRequest_1.BadRequest("One or more students not found");
    }
    for (const s of rideStudentsData) {
        if (!validPickupPointIds.includes(s.pickupPointId)) {
            throw new BadRequest_1.BadRequest(`Pickup point ${s.pickupPointId} not found in this route`);
        }
    }
    const rideId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.rides).values({
        id: rideId,
        organizationId,
        busId,
        driverId,
        codriverId: codriverId || null,
        routeId,
        name: name || null,
        rideType,
        frequency,
        repeatType: repeatType || null,
        startDate,
        endDate: endDate || null,
    });
    const rideStudentsInsert = rideStudentsData.map((s) => ({
        id: (0, uuid_1.v4)(),
        rideId,
        studentId: s.studentId,
        pickupPointId: s.pickupPointId,
        pickupTime: s.pickupTime || null,
    }));
    await db_1.db.insert(schema_1.rideStudents).values(rideStudentsInsert);
    (0, response_1.SuccessResponse)(res, {
        message: "Ride created successfully",
        rideId,
        studentsCount: rideStudentsData.length,
        busCapacity: bus[0].maxSeats,
    }, 201);
};
exports.createRide = createRide;
// ✅ Get All Rides
const getAllRides = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allRides = await db_1.db
        .select({
        id: schema_1.rides.id,
        name: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        frequency: schema_1.rides.frequency,
        repeatType: schema_1.rides.repeatType,
        startDate: schema_1.rides.startDate,
        endDate: schema_1.rides.endDate,
        isActive: schema_1.rides.isActive,
        status: schema_1.rides.status,
        createdAt: schema_1.rides.createdAt,
        bus: {
            id: schema_1.buses.id,
            busNumber: schema_1.buses.busNumber,
        },
        driver: {
            id: schema_1.drivers.id,
            name: schema_1.drivers.name,
        },
        route: {
            id: schema_1.Rout.id,
            name: schema_1.Rout.name,
        },
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { rides: allRides }, 200);
};
exports.getAllRides = getAllRides;
// ✅ Get Ride By ID
const getRideById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const ride = await db_1.db
        .select({
        id: schema_1.rides.id,
        name: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        frequency: schema_1.rides.frequency,
        repeatType: schema_1.rides.repeatType,
        startDate: schema_1.rides.startDate,
        endDate: schema_1.rides.endDate,
        isActive: schema_1.rides.isActive,
        status: schema_1.rides.status,
        startedAt: schema_1.rides.startedAt,
        completedAt: schema_1.rides.completedAt,
        currentLat: schema_1.rides.currentLat,
        currentLng: schema_1.rides.currentLng,
        createdAt: schema_1.rides.createdAt,
        bus: {
            id: schema_1.buses.id,
            busNumber: schema_1.buses.busNumber,
        },
        driver: {
            id: schema_1.drivers.id,
            name: schema_1.drivers.name,
            phone: schema_1.drivers.phone,
        },
        route: {
            id: schema_1.Rout.id,
            name: schema_1.Rout.name,
        },
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.id, id), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId)))
        .limit(1);
    if (!ride[0]) {
        throw new NotFound_1.NotFound("Ride not found");
    }
    // Get ride students
    const rideStudentsList = await db_1.db
        .select({
        id: schema_1.rideStudents.id,
        pickupTime: schema_1.rideStudents.pickupTime,
        status: schema_1.rideStudents.status,
        excuseReason: schema_1.rideStudents.excuseReason,
        pickedUpAt: schema_1.rideStudents.pickedUpAt,
        droppedOffAt: schema_1.rideStudents.droppedOffAt,
        student: {
            id: schema_1.students.id,
            name: schema_1.students.name,
            avatar: schema_1.students.avatar,
            grade: schema_1.students.grade,
            classroom: schema_1.students.classroom,
        },
        pickupPoint: {
            id: schema_1.pickupPoints.id,
            name: schema_1.pickupPoints.name,
            address: schema_1.pickupPoints.address,
        },
    })
        .from(schema_1.rideStudents)
        .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id));
    (0, response_1.SuccessResponse)(res, { ride: { ...ride[0], students: rideStudentsList } }, 200);
};
exports.getRideById = getRideById;
// ✅ Update Ride
const updateRide = async (req, res) => {
    const { id } = req.params;
    const { busId, driverId, codriverId, routeId, name, rideType, frequency, repeatType, startDate, endDate, isActive, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingRide = await db_1.db.select().from(schema_1.rides).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.id, id), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId))).limit(1);
    if (!existingRide[0])
        throw new NotFound_1.NotFound("Ride not found");
    if (busId) {
        const bus = await db_1.db.select().from(schema_1.buses).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, busId), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId))).limit(1);
        if (!bus[0])
            throw new NotFound_1.NotFound("Bus not found");
    }
    if (driverId) {
        const driver = await db_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, driverId), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId))).limit(1);
        if (!driver[0])
            throw new NotFound_1.NotFound("Driver not found");
    }
    if (codriverId) {
        const codriver = await db_1.db.select().from(schema_1.codrivers).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.codrivers.id, codriverId), (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId))).limit(1);
        if (!codriver[0])
            throw new NotFound_1.NotFound("Codriver not found");
    }
    if (routeId) {
        const route = await db_1.db.select().from(schema_1.Rout).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.id, routeId), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId))).limit(1);
        if (!route[0])
            throw new NotFound_1.NotFound("Route not found");
    }
    await db_1.db.update(schema_1.rides).set({
        busId: busId ?? existingRide[0].busId,
        driverId: driverId ?? existingRide[0].driverId,
        codriverId: codriverId !== undefined ? codriverId : existingRide[0].codriverId,
        routeId: routeId ?? existingRide[0].routeId,
        name: name !== undefined ? name : existingRide[0].name,
        rideType: rideType ?? existingRide[0].rideType,
        frequency: frequency ?? existingRide[0].frequency,
        repeatType: repeatType !== undefined ? repeatType : existingRide[0].repeatType,
        startDate: startDate ?? existingRide[0].startDate,
        endDate: endDate !== undefined ? endDate : existingRide[0].endDate,
        isActive: isActive ?? existingRide[0].isActive,
        status: status ?? existingRide[0].status,
    }).where((0, drizzle_orm_1.eq)(schema_1.rides.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Ride updated successfully" }, 200);
};
exports.updateRide = updateRide;
// ✅ Delete Ride
const deleteRide = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingRide = await db_1.db.select().from(schema_1.rides).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.id, id), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId))).limit(1);
    if (!existingRide[0])
        throw new NotFound_1.NotFound("Ride not found");
    await db_1.db.delete(schema_1.rideStudents).where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id));
    await db_1.db.delete(schema_1.rides).where((0, drizzle_orm_1.eq)(schema_1.rides.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Ride deleted successfully" }, 200);
};
exports.deleteRide = deleteRide;
// ✅ Add Students to Ride
const addStudentsToRide = async (req, res) => {
    const { id } = req.params;
    const { students: newStudents } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingRide = await db_1.db
        .select()
        .from(schema_1.rides)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.id, id), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId)))
        .limit(1);
    if (!existingRide[0])
        throw new NotFound_1.NotFound("Ride not found");
    // ✅ التحقق من سعة الباص
    await checkBusCapacity(existingRide[0].busId, id, newStudents.length);
    // Get route pickup points
    const routePickupPointsList = await db_1.db
        .select()
        .from(schema_1.routePickupPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, existingRide[0].routeId));
    const validPickupPointIds = routePickupPointsList.map((p) => p.pickupPointId);
    // Validate students
    const studentIds = newStudents.map((s) => s.studentId);
    // تحقق من عدم تكرار الطلاب
    const uniqueStudentIds = [...new Set(studentIds)];
    if (uniqueStudentIds.length !== studentIds.length) {
        throw new BadRequest_1.BadRequest("Duplicate students not allowed");
    }
    const existingStudents = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.students.id, studentIds), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)));
    if (existingStudents.length !== studentIds.length) {
        throw new BadRequest_1.BadRequest("One or more students not found");
    }
    // Check if students already in ride
    const alreadyInRide = await db_1.db
        .select()
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id), (0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, studentIds)));
    if (alreadyInRide.length > 0) {
        throw new BadRequest_1.BadRequest("One or more students already in this ride");
    }
    for (const s of newStudents) {
        if (!validPickupPointIds.includes(s.pickupPointId)) {
            throw new BadRequest_1.BadRequest(`Pickup point ${s.pickupPointId} not found in this route`);
        }
    }
    const rideStudentsInsert = newStudents.map((s) => ({
        id: (0, uuid_1.v4)(),
        rideId: id,
        studentId: s.studentId,
        pickupPointId: s.pickupPointId,
        pickupTime: s.pickupTime || null,
    }));
    await db_1.db.insert(schema_1.rideStudents).values(rideStudentsInsert);
    // جلب العدد الحالي
    const [currentCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id));
    const [bus] = await db_1.db
        .select({ maxSeats: schema_1.buses.maxSeats })
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.eq)(schema_1.buses.id, existingRide[0].busId))
        .limit(1);
    (0, response_1.SuccessResponse)(res, {
        message: "Students added to ride successfully",
        studentsAdded: newStudents.length,
        totalStudents: currentCount.count,
        busCapacity: bus.maxSeats,
        remainingSeats: bus.maxSeats - currentCount.count,
    }, 201);
};
exports.addStudentsToRide = addStudentsToRide;
// ✅ Remove Student from Ride
const removeStudentFromRide = async (req, res) => {
    const { id, studentId } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingRide = await db_1.db
        .select()
        .from(schema_1.rides)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.id, id), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId)))
        .limit(1);
    if (!existingRide[0])
        throw new NotFound_1.NotFound("Ride not found");
    const existingRideStudent = await db_1.db
        .select()
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id), (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, studentId)))
        .limit(1);
    if (!existingRideStudent[0])
        throw new NotFound_1.NotFound("Student not found in this ride");
    await db_1.db.delete(schema_1.rideStudents).where((0, drizzle_orm_1.eq)(schema_1.rideStudents.id, existingRideStudent[0].id));
    // جلب العدد المتبقي
    const [currentCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id));
    (0, response_1.SuccessResponse)(res, {
        message: "Student removed from ride successfully",
        remainingStudents: currentCount.count,
    }, 200);
};
exports.removeStudentFromRide = removeStudentFromRide;
