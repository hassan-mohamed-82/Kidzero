"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRideHistory = exports.getUpcomingRides = exports.completeRide = exports.markStudentAbsent = exports.dropOffStudent = exports.pickUpStudent = exports.updateLocation = exports.startRide = exports.getOccurrenceForDriver = exports.getMyTodayRides = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const BadRequest_1 = require("../../../Errors/BadRequest");
const firebase_1 = require("../../../utils/firebase");
// ✅ Get Driver's Today Rides
const getMyTodayRides = async (req, res) => {
    const driverId = req.user?.id;
    const organizationId = req.user?.organizationId;
    if (!driverId || !organizationId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    const today = new Date().toISOString().split("T")[0];
    const todayOccurrences = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        occurrenceStatus: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        completedAt: schema_1.rideOccurrences.completedAt,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.isActive, "on"), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${today}`))
        .orderBy(schema_1.rides.rideType);
    const occurrenceIds = todayOccurrences.map((o) => o.occurrenceId);
    let studentsCountMap = {};
    if (occurrenceIds.length > 0) {
        const counts = await db_1.db
            .select({
            occurrenceId: schema_1.rideOccurrenceStudents.occurrenceId,
            count: (0, drizzle_orm_1.sql) `COUNT(*)`,
        })
            .from(schema_1.rideOccurrenceStudents)
            .where((0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceIds))
            .groupBy(schema_1.rideOccurrenceStudents.occurrenceId);
        studentsCountMap = counts.reduce((acc, item) => {
            acc[item.occurrenceId] = Number(item.count);
            return acc;
        }, {});
    }
    const mapOccurrence = (o) => ({
        occurrenceId: o.occurrenceId,
        rideId: o.rideId,
        name: o.rideName,
        type: o.rideType,
        status: o.occurrenceStatus,
        startedAt: o.startedAt,
        completedAt: o.completedAt,
        bus: { id: o.busId, busNumber: o.busNumber, plateNumber: o.plateNumber },
        route: { id: o.routeId, name: o.routeName },
        studentsCount: studentsCountMap[o.occurrenceId] || 0,
    });
    const morning = todayOccurrences.filter((o) => o.rideType === "morning").map(mapOccurrence);
    const afternoon = todayOccurrences.filter((o) => o.rideType === "afternoon").map(mapOccurrence);
    (0, response_1.SuccessResponse)(res, {
        date: today,
        morning,
        afternoon,
        total: todayOccurrences.length,
    }, 200);
};
exports.getMyTodayRides = getMyTodayRides;
// ✅ Get Occurrence Details (for Driver)
const getOccurrenceForDriver = async (req, res) => {
    const { occurrenceId } = req.params;
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    if (!occurrenceId) {
        throw new BadRequest_1.BadRequest("Occurrence ID is required");
    }
    const occurrence = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        occurrenceStatus: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        completedAt: schema_1.rideOccurrences.completedAt,
        currentLat: schema_1.rideOccurrences.currentLat,
        currentLng: schema_1.rideOccurrences.currentLng,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId)))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Occurrence not found");
    }
    const occ = occurrence[0];
    const routeIdValue = occ.routeId;
    const occStudents = await db_1.db
        .select({
        id: schema_1.rideOccurrenceStudents.id,
        status: schema_1.rideOccurrenceStudents.status,
        pickupTime: schema_1.rideOccurrenceStudents.pickupTime,
        pickedUpAt: schema_1.rideOccurrenceStudents.pickedUpAt,
        droppedOffAt: schema_1.rideOccurrenceStudents.droppedOffAt,
        excuseReason: schema_1.rideOccurrenceStudents.excuseReason,
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentAvatar: schema_1.students.avatar,
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
        stopOrder: schema_1.routePickupPoints.stopOrder,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
        .leftJoin(schema_1.routePickupPoints, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.rideOccurrenceStudents.pickupPointId), routeIdValue ? (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, routeIdValue) : (0, drizzle_orm_1.sql) `1=1`))
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.routePickupPoints.stopOrder));
    let routeStops = [];
    if (routeIdValue) {
        routeStops = await db_1.db
            .select({
            id: schema_1.pickupPoints.id,
            name: schema_1.pickupPoints.name,
            lat: schema_1.pickupPoints.lat,
            lng: schema_1.pickupPoints.lng,
            stopOrder: schema_1.routePickupPoints.stopOrder,
        })
            .from(schema_1.routePickupPoints)
            .innerJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, schema_1.routePickupPoints.pickupPointId))
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, routeIdValue))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.routePickupPoints.stopOrder));
        routeStops = routeStops.map((stop) => ({
            ...stop,
            students: occStudents
                .filter((s) => s.pickupPointId === stop.id)
                .map((s) => ({
                id: s.id,
                status: s.status,
                student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
                parent: { id: s.parentId, name: s.parentName, phone: s.parentPhone },
            })),
        }));
    }
    const stats = {
        total: occStudents.length,
        pending: occStudents.filter((s) => s.status === "pending").length,
        pickedUp: occStudents.filter((s) => s.status === "picked_up").length,
        droppedOff: occStudents.filter((s) => s.status === "dropped_off").length,
        absent: occStudents.filter((s) => s.status === "absent").length,
        excused: occStudents.filter((s) => s.status === "excused").length,
    };
    (0, response_1.SuccessResponse)(res, {
        occurrence: {
            id: occ.occurrenceId,
            date: occ.occurDate,
            status: occ.occurrenceStatus,
            startedAt: occ.startedAt,
            completedAt: occ.completedAt,
        },
        ride: { id: occ.rideId, name: occ.rideName, type: occ.rideType },
        bus: { id: occ.busId, busNumber: occ.busNumber, plateNumber: occ.plateNumber },
        route: { id: occ.routeId, name: occ.routeName, stops: routeStops },
        stats,
        students: occStudents.map((s) => ({
            id: s.id,
            status: s.status,
            pickupTime: s.pickupTime,
            pickedUpAt: s.pickedUpAt,
            droppedOffAt: s.droppedOffAt,
            excuseReason: s.excuseReason,
            student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
            parent: { id: s.parentId, name: s.parentName, phone: s.parentPhone },
            pickupPoint: {
                id: s.pickupPointId,
                name: s.pickupPointName,
                lat: s.pickupPointLat,
                lng: s.pickupPointLng,
                stopOrder: s.stopOrder,
            },
        })),
    }, 200);
};
exports.getOccurrenceForDriver = getOccurrenceForDriver;
// ✅ Start Ride
const startRide = async (req, res) => {
    const { occurrenceId } = req.params;
    const { lat, lng } = req.body;
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    if (!occurrenceId) {
        throw new BadRequest_1.BadRequest("Occurrence ID is required");
    }
    const occurrence = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        status: schema_1.rideOccurrences.status,
        rideId: schema_1.rideOccurrences.rideId,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId)))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Occurrence not found");
    }
    if (occurrence[0].status !== "scheduled") {
        throw new BadRequest_1.BadRequest("Ride already started or completed");
    }
    await db_1.db.update(schema_1.rideOccurrences).set({
        status: "in_progress",
        startedAt: (0, drizzle_orm_1.sql) `NOW()`,
        currentLat: lat || null,
        currentLng: lng || null,
    }).where((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId));
    // Get students' parents to notify
    const studentsParents = await db_1.db
        .select({
        parentId: schema_1.parents.id,
        fcmTokens: schema_1.parents.fcmToken,
        studentName: schema_1.students.name,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
        .innerJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId));
    // Send notifications
    for (const parent of studentsParents) {
        if (parent.fcmTokens) {
            const tokens = typeof parent.fcmTokens === "string"
                ? JSON.parse(parent.fcmTokens)
                : parent.fcmTokens;
            if (tokens && tokens.length > 0) {
                await (0, firebase_1.sendPushNotification)(tokens, "Ride Started", `The school bus has started. ${parent.studentName} will be picked up soon.`, { type: "ride_started", occurrenceId });
            }
        }
        await db_1.db.insert(schema_1.notifications).values({
            userId: parent.parentId,
            userType: "parent",
            title: "Ride Started",
            body: `The school bus has started. ${parent.studentName} will be picked up soon.`,
            type: "ride_started",
            data: JSON.stringify({ occurrenceId }),
        });
    }
    (0, response_1.SuccessResponse)(res, {
        message: "Ride started successfully",
        occurrenceId,
        startedAt: new Date().toISOString(),
    }, 200);
};
exports.startRide = startRide;
// ✅ Update Location
const updateLocation = async (req, res) => {
    const { occurrenceId } = req.params;
    const { lat, lng } = req.body;
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    if (!occurrenceId) {
        throw new BadRequest_1.BadRequest("Occurrence ID is required");
    }
    if (!lat || !lng) {
        throw new BadRequest_1.BadRequest("Latitude and longitude are required");
    }
    const occurrence = await db_1.db
        .select({ occurrenceId: schema_1.rideOccurrences.id, status: schema_1.rideOccurrences.status })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress")))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Active occurrence not found");
    }
    await db_1.db.update(schema_1.rideOccurrences).set({
        currentLat: lat,
        currentLng: lng,
    }).where((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId));
    (0, response_1.SuccessResponse)(res, { message: "Location updated" }, 200);
};
exports.updateLocation = updateLocation;
// ✅ Pick Up Student
const pickUpStudent = async (req, res) => {
    const { occurrenceId, studentId } = req.params;
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    if (!occurrenceId || !studentId) {
        throw new BadRequest_1.BadRequest("Occurrence ID and Student ID are required");
    }
    const occurrence = await db_1.db
        .select({ occurrenceId: schema_1.rideOccurrences.id, status: schema_1.rideOccurrences.status })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress")))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Active occurrence not found");
    }
    const studentRecord = await db_1.db
        .select()
        .from(schema_1.rideOccurrenceStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentId)))
        .limit(1);
    if (!studentRecord[0]) {
        throw new NotFound_1.NotFound("Student not found in this ride");
    }
    if (studentRecord[0].status !== "pending") {
        throw new BadRequest_1.BadRequest("Student already processed");
    }
    await db_1.db.update(schema_1.rideOccurrenceStudents).set({
        status: "picked_up",
        pickedUpAt: (0, drizzle_orm_1.sql) `NOW()`,
    }).where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentId));
    // Notify parent
    const studentInfo = await db_1.db
        .select({
        studentName: schema_1.students.name,
        parentId: schema_1.parents.id,
        fcmTokens: schema_1.parents.fcmToken,
    })
        .from(schema_1.students)
        .innerJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentRecord[0].studentId))
        .limit(1);
    if (studentInfo[0]) {
        const { studentName, parentId, fcmTokens } = studentInfo[0];
        if (fcmTokens) {
            const tokens = typeof fcmTokens === "string" ? JSON.parse(fcmTokens) : fcmTokens;
            if (tokens && tokens.length > 0) {
                await (0, firebase_1.sendPushNotification)(tokens, "Student Picked Up", `${studentName} has been picked up by the school bus.`, { type: "student_picked_up", occurrenceId, studentId: studentRecord[0].studentId });
            }
        }
        await db_1.db.insert(schema_1.notifications).values({
            userId: parentId,
            userType: "parent",
            title: "Student Picked Up",
            body: `${studentName} has been picked up by the school bus.`,
            type: "student_picked_up",
            data: JSON.stringify({ occurrenceId, studentId: studentRecord[0].studentId }),
        });
    }
    (0, response_1.SuccessResponse)(res, { message: "Student picked up successfully" }, 200);
};
exports.pickUpStudent = pickUpStudent;
// ✅ Drop Off Student
const dropOffStudent = async (req, res) => {
    const { occurrenceId, studentId } = req.params;
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    if (!occurrenceId || !studentId) {
        throw new BadRequest_1.BadRequest("Occurrence ID and Student ID are required");
    }
    const occurrence = await db_1.db
        .select({ occurrenceId: schema_1.rideOccurrences.id })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress")))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Active occurrence not found");
    }
    const studentRecord = await db_1.db
        .select()
        .from(schema_1.rideOccurrenceStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentId)))
        .limit(1);
    if (!studentRecord[0]) {
        throw new NotFound_1.NotFound("Student not found in this ride");
    }
    if (studentRecord[0].status !== "picked_up") {
        throw new BadRequest_1.BadRequest("Student must be picked up first");
    }
    await db_1.db.update(schema_1.rideOccurrenceStudents).set({
        status: "dropped_off",
        droppedOffAt: (0, drizzle_orm_1.sql) `NOW()`,
    }).where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentId));
    // Notify parent
    const studentInfo = await db_1.db
        .select({
        studentName: schema_1.students.name,
        parentId: schema_1.parents.id,
        fcmTokens: schema_1.parents.fcmToken,
    })
        .from(schema_1.students)
        .innerJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentRecord[0].studentId))
        .limit(1);
    if (studentInfo[0]) {
        const { studentName, parentId, fcmTokens } = studentInfo[0];
        if (fcmTokens) {
            const tokens = typeof fcmTokens === "string" ? JSON.parse(fcmTokens) : fcmTokens;
            if (tokens && tokens.length > 0) {
                await (0, firebase_1.sendPushNotification)(tokens, "Student Dropped Off", `${studentName} has arrived safely.`, { type: "student_dropped_off", occurrenceId });
            }
        }
        await db_1.db.insert(schema_1.notifications).values({
            userId: parentId,
            userType: "parent",
            title: "Student Dropped Off",
            body: `${studentName} has arrived safely.`,
            type: "student_dropped_off",
            data: JSON.stringify({ occurrenceId }),
        });
    }
    (0, response_1.SuccessResponse)(res, { message: "Student dropped off successfully" }, 200);
};
exports.dropOffStudent = dropOffStudent;
// ✅ Mark Student Absent
const markStudentAbsent = async (req, res) => {
    const { occurrenceId, studentId } = req.params;
    const { reason } = req.body;
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    if (!occurrenceId || !studentId) {
        throw new BadRequest_1.BadRequest("Occurrence ID and Student ID are required");
    }
    const occurrence = await db_1.db
        .select({ occurrenceId: schema_1.rideOccurrences.id })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress")))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Active occurrence not found");
    }
    const studentRecord = await db_1.db
        .select()
        .from(schema_1.rideOccurrenceStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentId)))
        .limit(1);
    if (!studentRecord[0]) {
        throw new NotFound_1.NotFound("Student not found in this ride");
    }
    if (studentRecord[0].status !== "pending") {
        throw new BadRequest_1.BadRequest("Student already processed");
    }
    await db_1.db.update(schema_1.rideOccurrenceStudents).set({
        status: "absent",
        excuseReason: reason || null,
    }).where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentId));
    (0, response_1.SuccessResponse)(res, { message: "Student marked as absent" }, 200);
};
exports.markStudentAbsent = markStudentAbsent;
// ✅ Complete Ride
const completeRide = async (req, res) => {
    const { occurrenceId } = req.params;
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    if (!occurrenceId) {
        throw new BadRequest_1.BadRequest("Occurrence ID is required");
    }
    const occurrence = await db_1.db
        .select({ occurrenceId: schema_1.rideOccurrences.id, status: schema_1.rideOccurrences.status })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId)))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Occurrence not found");
    }
    if (occurrence[0].status !== "in_progress") {
        throw new BadRequest_1.BadRequest("Ride is not in progress");
    }
    const pendingStudents = await db_1.db
        .select()
        .from(schema_1.rideOccurrenceStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.status, "pending")));
    if (pendingStudents.length > 0) {
        throw new BadRequest_1.BadRequest(`${pendingStudents.length} students still pending`);
    }
    await db_1.db.update(schema_1.rideOccurrences).set({
        status: "completed",
        completedAt: (0, drizzle_orm_1.sql) `NOW()`,
    }).where((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId));
    // Notify all parents
    const studentsParents = await db_1.db
        .select({
        parentId: schema_1.parents.id,
        fcmTokens: schema_1.parents.fcmToken,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
        .innerJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId));
    for (const parent of studentsParents) {
        if (parent.fcmTokens) {
            const tokens = typeof parent.fcmTokens === "string"
                ? JSON.parse(parent.fcmTokens)
                : parent.fcmTokens;
            if (tokens && tokens.length > 0) {
                await (0, firebase_1.sendPushNotification)(tokens, "Ride Completed", "The school bus ride has been completed.", { type: "ride_completed", occurrenceId });
            }
        }
        await db_1.db.insert(schema_1.notifications).values({
            userId: parent.parentId,
            userType: "parent",
            title: "Ride Completed",
            body: "The school bus ride has been completed.",
            type: "ride_completed",
            data: JSON.stringify({ occurrenceId }),
        });
    }
    (0, response_1.SuccessResponse)(res, {
        message: "Ride completed successfully",
        completedAt: new Date().toISOString(),
    }, 200);
};
exports.completeRide = completeRide;
const getUpcomingRides = async (req, res) => {
    const driverId = req.user?.id;
    const organizationId = req.user?.organizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    if (!driverId || !organizationId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    // جلب الرحلات القادمة (بعد اليوم)
    const upcomingOccurrences = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        occurrenceStatus: schema_1.rideOccurrences.status,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) > ${todayStr}`, (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "scheduled"), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress"))))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.rideOccurrences.occurDate))
        .limit(limit)
        .offset(offset);
    // عد الإجمالي
    const [totalResult] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) > ${todayStr}`, (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "scheduled"), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress"))));
    // عد الطلاب لكل occurrence
    const ridesWithCounts = await Promise.all(upcomingOccurrences.map(async (occ) => {
        const [studentCount] = await db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.rideOccurrenceStudents)
            .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occ.occurrenceId));
        return {
            ...occ,
            studentCount: studentCount?.count || 0,
        };
    }));
    // تجميع حسب التاريخ
    const groupedByDate = ridesWithCounts.reduce((acc, ride) => {
        const dateKey = ride.occurDate instanceof Date
            ? ride.occurDate.toISOString().split("T")[0]
            : String(ride.occurDate);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(ride);
        return acc;
    }, {});
    return (0, response_1.SuccessResponse)(res, {
        rides: groupedByDate, message: "Upcoming rides fetched successfully"
    });
};
exports.getUpcomingRides = getUpcomingRides;
// ===================== GET RIDE HISTORY =====================
const getRideHistory = async (req, res) => {
    const driverId = req.user?.id;
    const organizationId = req.user?.organizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const from = req.query.from;
    const to = req.query.to;
    if (!driverId || !organizationId) {
        throw new BadRequest_1.BadRequest("Driver authentication required");
    }
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    // بناء شروط التصفية
    const conditions = [
        (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId),
        (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId),
        (0, drizzle_orm_1.or)((0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) < ${todayStr}`, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "completed"), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "cancelled")),
    ];
    // إضافة فلتر التاريخ إذا موجود
    if (from) {
        conditions.push((0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) >= ${from}`);
    }
    if (to) {
        conditions.push((0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) <= ${to}`);
    }
    // جلب السجل
    const historyOccurrences = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        occurrenceStatus: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        completedAt: schema_1.rideOccurrences.completedAt,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.rideOccurrences.occurDate))
        .limit(limit)
        .offset(offset);
    // عد الإجمالي
    const [totalResult] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)(...conditions));
    // عد الطلاب وإحصائياتهم لكل occurrence
    const ridesWithStats = await Promise.all(historyOccurrences.map(async (occ) => {
        const studentStats = await db_1.db
            .select({
            status: schema_1.rideOccurrenceStudents.status,
            count: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.rideOccurrenceStudents)
            .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occ.occurrenceId))
            .groupBy(schema_1.rideOccurrenceStudents.status);
        const stats = {
            total: 0,
            pickedUp: 0,
            droppedOff: 0,
            absent: 0,
            excused: 0,
        };
        studentStats.forEach((s) => {
            stats.total += Number(s.count);
            if (s.status === "picked_up")
                stats.pickedUp = Number(s.count);
            if (s.status === "dropped_off")
                stats.droppedOff = Number(s.count);
            if (s.status === "absent")
                stats.absent = Number(s.count);
            if (s.status === "excused")
                stats.excused = Number(s.count);
        });
        return {
            ...occ,
            studentStats: stats,
        };
    }));
    // تجميع حسب التاريخ
    const groupedByDate = ridesWithStats.reduce((acc, ride) => {
        const dateKey = ride.occurDate instanceof Date
            ? ride.occurDate.toISOString().split("T")[0]
            : String(ride.occurDate);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(ride);
        return acc;
    }, {});
    (0, response_1.SuccessResponse)(res, { rides: groupedByDate, message: "Ride history fetched successfully" });
};
exports.getRideHistory = getRideHistory;
