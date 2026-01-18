"use strict";
// src/controllers/users/parent/rides.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitExcuse = exports.getLiveTracking = exports.getChildRides = exports.getMyChildrenRides = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const BadRequest_1 = require("../../../Errors/BadRequest");
const getMyChildrenRides = async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    // جلب أولاد الـ Parent
    const myChildren = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        return (0, response_1.SuccessResponse)(res, { children: [] }, 200);
    }
    const childrenIds = myChildren.map((c) => c.id);
    // جلب الرحلات لكل طفل
    const childrenRides = await db_1.db
        .select({
        studentId: schema_1.rideStudents.studentId,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        pickupTime: schema_1.rideStudents.pickupTime,
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
    })
        .from(schema_1.rideStudents)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, schema_1.rides.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, childrenIds), (0, drizzle_orm_1.eq)(schema_1.rides.isActive, "on")));
    // تجميع البيانات
    const childrenWithRides = myChildren.map((child) => ({
        ...child,
        rides: childrenRides
            .filter((r) => r.studentId === child.id)
            .map((r) => ({
            id: r.rideId,
            name: r.rideName,
            type: r.rideType,
            pickupTime: r.pickupTime,
            pickupPoint: {
                id: r.pickupPointId,
                name: r.pickupPointName,
                lat: r.pickupPointLat,
                lng: r.pickupPointLng,
            },
            bus: {
                id: r.busId,
                busNumber: r.busNumber,
                plateNumber: r.plateNumber,
            },
            driver: {
                id: r.driverId,
                name: r.driverName,
                phone: r.driverPhone,
                avatar: r.driverAvatar,
            },
        })),
    }));
    (0, response_1.SuccessResponse)(res, { children: childrenWithRides }, 200);
};
exports.getMyChildrenRides = getMyChildrenRides;
// ✅ Get Child Rides (today / upcoming / history)
const getChildRides = async (req, res) => {
    const { childId } = req.params;
    const { type = "today", from, to, page = 1, limit = 20 } = req.query;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    // تحقق إن الطالب ابن الـ Parent
    const child = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, childId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!child[0]) {
        throw new NotFound_1.NotFound("Child not found");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // بناء الشروط حسب النوع
    let dateCondition;
    let orderDirection = (0, drizzle_orm_1.desc)(schema_1.rideOccurrences.occurDate);
    switch (type) {
        case "today":
            dateCondition = (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = CURDATE()`;
            break;
        case "upcoming":
            dateCondition = (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, today);
            orderDirection = (0, drizzle_orm_1.asc)(schema_1.rideOccurrences.occurDate);
            break;
        case "history":
            dateCondition = (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, today);
            // إضافة فلترة بالتاريخ إذا موجودة
            if (from) {
                dateCondition = (0, drizzle_orm_1.and)(dateCondition, (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, new Date(from)));
            }
            if (to) {
                dateCondition = (0, drizzle_orm_1.and)(dateCondition, (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, new Date(to)));
            }
            break;
        default:
            throw new BadRequest_1.BadRequest("Invalid type. Use: today, upcoming, or history");
    }
    const offset = (Number(page) - 1) * Number(limit);
    // جلب الرحلات
    const ridesData = await db_1.db
        .select({
        // Occurrence
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        occurrenceStatus: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        completedAt: schema_1.rideOccurrences.completedAt,
        currentLat: schema_1.rideOccurrences.currentLat,
        currentLng: schema_1.rideOccurrences.currentLng,
        // Ride
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        // Student Status
        studentOccurrenceId: schema_1.rideOccurrenceStudents.id,
        studentStatus: schema_1.rideOccurrenceStudents.status,
        pickedUpAt: schema_1.rideOccurrenceStudents.pickedUpAt,
        droppedOffAt: schema_1.rideOccurrenceStudents.droppedOffAt,
        pickupTime: schema_1.rideOccurrenceStudents.pickupTime,
        excuseReason: schema_1.rideOccurrenceStudents.excuseReason,
        // Bus
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        // Driver
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
        // Pickup Point
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, childId), dateCondition))
        .orderBy(orderDirection, schema_1.rides.rideType)
        .limit(Number(limit))
        .offset(offset);
    // تنسيق البيانات
    const formattedRides = ridesData.map((r) => ({
        occurrenceId: r.occurrenceId,
        date: r.occurDate,
        status: r.occurrenceStatus,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        busLocation: r.occurrenceStatus === "in_progress" ? {
            lat: r.currentLat,
            lng: r.currentLng,
        } : null,
        ride: {
            id: r.rideId,
            name: r.rideName,
            type: r.rideType,
        },
        studentStatus: {
            id: r.studentOccurrenceId,
            status: r.studentStatus,
            pickedUpAt: r.pickedUpAt,
            droppedOffAt: r.droppedOffAt,
            pickupTime: r.pickupTime,
            excuseReason: r.excuseReason,
        },
        bus: {
            id: r.busId,
            busNumber: r.busNumber,
            plateNumber: r.plateNumber,
        },
        driver: {
            id: r.driverId,
            name: r.driverName,
            phone: r.driverPhone,
            avatar: r.driverAvatar,
        },
        pickupPoint: {
            id: r.pickupPointId,
            name: r.pickupPointName,
            lat: r.pickupPointLat,
            lng: r.pickupPointLng,
        },
    }));
    // تقسيم حسب النوع (للـ today فقط)
    let response = {
        child: child[0],
        type,
        rides: formattedRides,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            count: formattedRides.length,
        },
    };
    // إذا كان today، نقسم morning و afternoon
    if (type === "today") {
        response = {
            child: child[0],
            type,
            date: today.toISOString().split("T")[0],
            morning: formattedRides.filter((r) => r.ride.type === "morning"),
            afternoon: formattedRides.filter((r) => r.ride.type === "afternoon"),
            total: formattedRides.length,
        };
    }
    (0, response_1.SuccessResponse)(res, response, 200);
};
exports.getChildRides = getChildRides;
// ✅ Get Live Tracking for a Ride
const getLiveTracking = async (req, res) => {
    const { occurrenceId } = req.params;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    // تحقق إن الـ Parent عنده طفل في هذه الرحلة
    const myChildren = await db_1.db
        .select({ id: schema_1.students.id })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        throw new NotFound_1.NotFound("No children found");
    }
    const childrenIds = myChildren.map((c) => c.id);
    const occurrence = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        status: schema_1.rideOccurrences.status,
        currentLat: schema_1.rideOccurrences.currentLat,
        currentLng: schema_1.rideOccurrences.currentLng,
        startedAt: schema_1.rideOccurrences.startedAt,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .innerJoin(schema_1.rideOccurrenceStudents, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, childrenIds)))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Ride not found or access denied");
    }
    // جلب حالة أطفال الـ Parent في هذه الرحلة
    const childrenStatus = await db_1.db
        .select({
        id: schema_1.rideOccurrenceStudents.id,
        status: schema_1.rideOccurrenceStudents.status,
        pickedUpAt: schema_1.rideOccurrenceStudents.pickedUpAt,
        droppedOffAt: schema_1.rideOccurrenceStudents.droppedOffAt,
        childId: schema_1.students.id,
        childName: schema_1.students.name,
        childAvatar: schema_1.students.avatar,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, childrenIds)));
    const occ = occurrence[0];
    (0, response_1.SuccessResponse)(res, {
        ride: {
            id: occ.occurrenceId,
            name: occ.rideName,
            type: occ.rideType,
            status: occ.status,
            startedAt: occ.startedAt,
        },
        bus: {
            busNumber: occ.busNumber,
            plateNumber: occ.plateNumber,
            currentLocation: occ.status === "in_progress" ? {
                lat: occ.currentLat,
                lng: occ.currentLng,
            } : null,
        },
        driver: {
            name: occ.driverName,
            phone: occ.driverPhone,
        },
        children: childrenStatus.map((c) => ({
            id: c.id,
            status: c.status,
            pickedUpAt: c.pickedUpAt,
            droppedOffAt: c.droppedOffAt,
            child: {
                id: c.childId,
                name: c.childName,
                avatar: c.childAvatar,
            },
            pickupPoint: {
                name: c.pickupPointName,
                lat: c.pickupPointLat,
                lng: c.pickupPointLng,
            },
        })),
    }, 200);
};
exports.getLiveTracking = getLiveTracking;
// ✅ Submit Excuse for Child (عذر غياب)
const submitExcuse = async (req, res) => {
    const { occurrenceId, studentId } = req.params;
    const { reason } = req.body;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    if (!reason) {
        throw new BadRequest_1.BadRequest("Excuse reason is required");
    }
    // تحقق إن الطالب ابن الـ Parent
    const child = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, studentId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!child[0]) {
        throw new NotFound_1.NotFound("Child not found");
    }
    // تحقق من وجود الطالب في الرحلة
    const studentOccurrence = await db_1.db
        .select()
        .from(schema_1.rideOccurrenceStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, studentId)))
        .limit(1);
    if (!studentOccurrence[0]) {
        throw new NotFound_1.NotFound("Student not in this ride");
    }
    if (studentOccurrence[0].status !== "pending") {
        throw new BadRequest_1.BadRequest("Cannot submit excuse - student already processed");
    }
    // تحديث حالة الطالب
    await db_1.db.update(schema_1.rideOccurrenceStudents).set({
        status: "excused",
        excuseReason: reason,
    }).where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentOccurrence[0].id));
    (0, response_1.SuccessResponse)(res, { message: "Excuse submitted successfully" }, 200);
};
exports.submitExcuse = submitExcuse;
// ✅ Helper Function
function formatRideResponse(r) {
    return {
        occurrenceId: r.occurrenceId,
        date: r.occurDate,
        status: r.occurrenceStatus,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        busLocation: r.occurrenceStatus === "in_progress" ? {
            lat: r.currentLat,
            lng: r.currentLng,
        } : null,
        ride: {
            id: r.rideId,
            name: r.rideName,
            type: r.rideType,
        },
        child: {
            id: r.childId,
            name: r.childName,
            avatar: r.childAvatar,
            status: r.studentStatus,
            pickedUpAt: r.pickedUpAt,
            droppedOffAt: r.droppedOffAt,
            pickupTime: r.pickupTime,
            excuseReason: r.excuseReason,
        },
        pickupPoint: {
            id: r.pickupPointId,
            name: r.pickupPointName,
            lat: r.pickupPointLat,
            lng: r.pickupPointLng,
        },
        bus: {
            id: r.busId,
            busNumber: r.busNumber,
            plateNumber: r.plateNumber,
        },
        driver: {
            id: r.driverId,
            name: r.driverName,
            phone: r.driverPhone,
        },
    };
}
