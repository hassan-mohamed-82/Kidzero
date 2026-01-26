"use strict";
// src/controllers/users/parent/rides.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRideHistorySummary = exports.getUpcomingRides = exports.getActiveRides = exports.submitExcuse = exports.getLiveTracking = exports.getChildRides = exports.getTodayRidesForAllChildren = exports.getMyChildrenRides = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const BadRequest_1 = require("../../../Errors/BadRequest");
// ✅ Get All Children with Their Rides
const getMyChildrenRides = async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    // جلب أولاد الـ Parent مع معلومات المدرسة
    const myChildren = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        code: schema_1.students.code,
        // معلومات المدرسة
        organizationId: schema_1.students.organizationId,
        organizationName: schema_1.organizations.name,
        organizationLogo: schema_1.organizations.logo,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.students.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        return (0, response_1.SuccessResponse)(res, {
            children: [],
            byOrganization: [],
            totalChildren: 0,
        }, 200);
    }
    const childrenIds = myChildren.map((c) => c.id);
    // جلب الرحلات لكل طفل
    const childrenRides = await db_1.db
        .select({
        studentId: schema_1.rideStudents.studentId,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        frequency: schema_1.rides.frequency,
        pickupTime: schema_1.rideStudents.pickupTime,
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointAddress: schema_1.pickupPoints.address,
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
    // تجميع البيانات مع المدرسة
    const childrenWithRides = myChildren.map((child) => ({
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        grade: child.grade,
        classroom: child.classroom,
        code: child.code,
        organization: {
            id: child.organizationId,
            name: child.organizationName,
            logo: child.organizationLogo,
        },
        rides: childrenRides
            .filter((r) => r.studentId === child.id)
            .map((r) => ({
            id: r.rideId,
            name: r.rideName,
            type: r.rideType,
            frequency: r.frequency,
            pickupTime: r.pickupTime,
            pickupPoint: r.pickupPointId
                ? {
                    id: r.pickupPointId,
                    name: r.pickupPointName,
                    address: r.pickupPointAddress,
                    location: {
                        lat: r.pickupPointLat,
                        lng: r.pickupPointLng,
                    },
                }
                : null,
            bus: r.busId
                ? {
                    id: r.busId,
                    busNumber: r.busNumber,
                    plateNumber: r.plateNumber,
                }
                : null,
            driver: r.driverId
                ? {
                    id: r.driverId,
                    name: r.driverName,
                    phone: r.driverPhone,
                    avatar: r.driverAvatar,
                }
                : null,
        })),
    }));
    // تجميع حسب المدرسة
    const byOrganization = Object.values(childrenWithRides.reduce((acc, child) => {
        const orgId = child.organization.id;
        if (!acc[orgId]) {
            acc[orgId] = {
                organization: child.organization,
                children: [],
            };
        }
        acc[orgId].children.push(child);
        return acc;
    }, {}));
    (0, response_1.SuccessResponse)(res, {
        children: childrenWithRides,
        byOrganization,
        totalChildren: childrenWithRides.length,
    }, 200);
};
exports.getMyChildrenRides = getMyChildrenRides;
// ✅ Get Today's Rides for All Children
const getTodayRidesForAllChildren = async (req, res) => {
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
        organizationId: schema_1.students.organizationId,
        organizationName: schema_1.organizations.name,
        organizationLogo: schema_1.organizations.logo,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.students.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        return (0, response_1.SuccessResponse)(res, {
            date: new Date().toISOString().split("T")[0],
            children: [],
            summary: {
                total: 0,
                pending: 0,
                pickedUp: 0,
                droppedOff: 0,
                absent: 0,
                excused: 0,
            },
        }, 200);
    }
    const childrenIds = myChildren.map((c) => c.id);
    // جلب رحلات اليوم
    const todayRides = await db_1.db
        .select({
        // Student
        studentId: schema_1.rideOccurrenceStudents.studentId,
        studentStatus: schema_1.rideOccurrenceStudents.status,
        pickedUpAt: schema_1.rideOccurrenceStudents.pickedUpAt,
        droppedOffAt: schema_1.rideOccurrenceStudents.droppedOffAt,
        pickupTime: schema_1.rideOccurrenceStudents.pickupTime,
        excuseReason: schema_1.rideOccurrenceStudents.excuseReason,
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
        pickupPointAddress: schema_1.pickupPoints.address,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, childrenIds), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = CURDATE()`))
        .orderBy(schema_1.rides.rideType);
    // تجميع حسب الطفل
    const childrenWithTodayRides = myChildren.map((child) => {
        const childRides = todayRides.filter((r) => r.studentId === child.id);
        return {
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            grade: child.grade,
            organization: {
                id: child.organizationId,
                name: child.organizationName,
                logo: child.organizationLogo,
            },
            morning: childRides
                .filter((r) => r.rideType === "morning")
                .map(formatTodayRide),
            afternoon: childRides
                .filter((r) => r.rideType === "afternoon")
                .map(formatTodayRide),
            totalRides: childRides.length,
        };
    });
    // إحصائيات
    const summary = {
        total: todayRides.length,
        pending: todayRides.filter((r) => r.studentStatus === "pending").length,
        pickedUp: todayRides.filter((r) => r.studentStatus === "picked_up").length,
        droppedOff: todayRides.filter((r) => r.studentStatus === "dropped_off").length,
        absent: todayRides.filter((r) => r.studentStatus === "absent").length,
        excused: todayRides.filter((r) => r.studentStatus === "excused").length,
    };
    (0, response_1.SuccessResponse)(res, {
        date: new Date().toISOString().split("T")[0],
        children: childrenWithTodayRides,
        summary,
    }, 200);
};
exports.getTodayRidesForAllChildren = getTodayRidesForAllChildren;
// ✅ Get Child Rides (today / upcoming / history)
const getChildRides = async (req, res) => {
    const { childId } = req.params;
    const { type = "today", from, to, page = 1, limit = 20 } = req.query;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    // تحقق إن الطالب ابن الـ Parent
    const [child] = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        organizationId: schema_1.students.organizationId,
        organizationName: schema_1.organizations.name,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.students.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, childId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!child) {
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
        pickupPointAddress: schema_1.pickupPoints.address,
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
        busLocation: r.occurrenceStatus === "in_progress"
            ? {
                lat: r.currentLat,
                lng: r.currentLng,
            }
            : null,
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
        bus: r.busId
            ? {
                id: r.busId,
                busNumber: r.busNumber,
                plateNumber: r.plateNumber,
            }
            : null,
        driver: r.driverId
            ? {
                id: r.driverId,
                name: r.driverName,
                phone: r.driverPhone,
                avatar: r.driverAvatar,
            }
            : null,
        pickupPoint: r.pickupPointId
            ? {
                id: r.pickupPointId,
                name: r.pickupPointName,
                address: r.pickupPointAddress,
                lat: r.pickupPointLat,
                lng: r.pickupPointLng,
            }
            : null,
    }));
    // بناء الـ Response
    let response = {
        child: {
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            grade: child.grade,
            classroom: child.classroom,
            organization: {
                id: child.organizationId,
                name: child.organizationName,
            },
        },
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
            child: response.child,
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
    // ✅ 1) جلب أولاد الـ Parent
    const myChildren = await db_1.db
        .select({ id: schema_1.students.id, name: schema_1.students.name })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        throw new NotFound_1.NotFound("No children found");
    }
    const childrenIds = myChildren.map((c) => c.id);
    // ✅ 2) جلب الـ Occurrence أولاً (بدون التحقق من الأطفال)
    const [occurrence] = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        status: schema_1.rideOccurrences.status,
        currentLat: schema_1.rideOccurrences.currentLat,
        currentLng: schema_1.rideOccurrences.currentLng,
        startedAt: schema_1.rideOccurrences.startedAt,
        completedAt: schema_1.rideOccurrences.completedAt,
        // Ride
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        // Bus
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        // Driver
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
        // Route
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId))
        .limit(1);
    if (!occurrence) {
        throw new NotFound_1.NotFound("Ride occurrence not found");
    }
    // ✅ 3) التحقق إن الـ Parent عنده طفل في هذه الرحلة
    const childInRide = await db_1.db
        .select({ studentId: schema_1.rideOccurrenceStudents.studentId })
        .from(schema_1.rideOccurrenceStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, childrenIds)))
        .limit(1);
    if (childInRide.length === 0) {
        throw new NotFound_1.NotFound("Access denied - no children in this ride");
    }
    // ✅ 4) جلب حالة أطفال الـ Parent في هذه الرحلة
    const childrenStatus = await db_1.db
        .select({
        id: schema_1.rideOccurrenceStudents.id,
        status: schema_1.rideOccurrenceStudents.status,
        pickedUpAt: schema_1.rideOccurrenceStudents.pickedUpAt,
        droppedOffAt: schema_1.rideOccurrenceStudents.droppedOffAt,
        pickupTime: schema_1.rideOccurrenceStudents.pickupTime,
        excuseReason: schema_1.rideOccurrenceStudents.excuseReason,
        // Child
        childId: schema_1.students.id,
        childName: schema_1.students.name,
        childAvatar: schema_1.students.avatar,
        childGrade: schema_1.students.grade,
        // Pickup Point
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointAddress: schema_1.pickupPoints.address,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, childrenIds)));
    // ✅ 5) جلب نقاط المسار
    let routeStops = [];
    if (occurrence.routeId) {
        routeStops = await db_1.db
            .select({
            id: schema_1.pickupPoints.id,
            name: schema_1.pickupPoints.name,
            address: schema_1.pickupPoints.address,
            lat: schema_1.pickupPoints.lat,
            lng: schema_1.pickupPoints.lng,
            stopOrder: schema_1.routePickupPoints.stopOrder,
        })
            .from(schema_1.routePickupPoints)
            .innerJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.pickupPoints.id))
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, occurrence.routeId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.routePickupPoints.stopOrder));
    }
    // ✅ 6) إرجاع البيانات
    (0, response_1.SuccessResponse)(res, {
        occurrence: {
            id: occurrence.occurrenceId,
            date: occurrence.occurDate,
            status: occurrence.status,
            startedAt: occurrence.startedAt,
            completedAt: occurrence.completedAt,
        },
        ride: {
            id: occurrence.rideId,
            name: occurrence.rideName,
            type: occurrence.rideType,
        },
        bus: occurrence.busId
            ? {
                id: occurrence.busId,
                busNumber: occurrence.busNumber,
                plateNumber: occurrence.plateNumber,
                currentLocation: occurrence.status === "in_progress"
                    ? {
                        lat: occurrence.currentLat,
                        lng: occurrence.currentLng,
                    }
                    : null,
            }
            : null,
        driver: occurrence.driverId
            ? {
                id: occurrence.driverId,
                name: occurrence.driverName,
                phone: occurrence.driverPhone,
                avatar: occurrence.driverAvatar,
            }
            : null,
        route: occurrence.routeId
            ? {
                id: occurrence.routeId,
                name: occurrence.routeName,
                stops: routeStops,
            }
            : null,
        children: childrenStatus.map((c) => ({
            id: c.id,
            status: c.status,
            pickedUpAt: c.pickedUpAt,
            droppedOffAt: c.droppedOffAt,
            pickupTime: c.pickupTime,
            excuseReason: c.excuseReason,
            child: {
                id: c.childId,
                name: c.childName,
                avatar: c.childAvatar,
                grade: c.childGrade,
            },
            pickupPoint: c.pickupPointId
                ? {
                    id: c.pickupPointId,
                    name: c.pickupPointName,
                    address: c.pickupPointAddress,
                    lat: c.pickupPointLat,
                    lng: c.pickupPointLng,
                }
                : null,
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
    if (!reason || reason.trim() === "") {
        throw new BadRequest_1.BadRequest("Excuse reason is required");
    }
    // تحقق إن الطالب ابن الـ Parent
    const [child] = await db_1.db
        .select({ id: schema_1.students.id, name: schema_1.students.name })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, studentId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!child) {
        throw new NotFound_1.NotFound("Child not found");
    }
    // تحقق من وجود الطالب في الرحلة
    const [studentOccurrence] = await db_1.db
        .select({
        id: schema_1.rideOccurrenceStudents.id,
        status: schema_1.rideOccurrenceStudents.status,
        occurDate: schema_1.rideOccurrences.occurDate,
        occurrenceStatus: schema_1.rideOccurrences.status,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, studentId)))
        .limit(1);
    if (!studentOccurrence) {
        throw new NotFound_1.NotFound("Student not in this ride");
    }
    // تحقق من حالة الرحلة
    if (studentOccurrence.occurrenceStatus === "completed") {
        throw new BadRequest_1.BadRequest("Cannot submit excuse - ride already completed");
    }
    if (studentOccurrence.occurrenceStatus === "cancelled") {
        throw new BadRequest_1.BadRequest("Cannot submit excuse - ride is cancelled");
    }
    // تحقق من حالة الطالب
    if (studentOccurrence.status !== "pending") {
        throw new BadRequest_1.BadRequest(`Cannot submit excuse - student status is: ${studentOccurrence.status}`);
    }
    // تحديث حالة الطالب
    await db_1.db
        .update(schema_1.rideOccurrenceStudents)
        .set({
        status: "excused",
        excuseReason: reason.trim(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.id, studentOccurrence.id));
    (0, response_1.SuccessResponse)(res, {
        message: "تم تقديم العذر بنجاح",
        excuse: {
            childId: child.id,
            childName: child.name,
            occurrenceId,
            reason: reason.trim(),
            status: "excused",
        },
    }, 200);
};
exports.submitExcuse = submitExcuse;
// ✅ Get Active Rides (الرحلات الجارية حالياً)
const getActiveRides = async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    const myChildren = await db_1.db
        .select({ id: schema_1.students.id, name: schema_1.students.name, avatar: schema_1.students.avatar })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        return (0, response_1.SuccessResponse)(res, { activeRides: [], count: 0 }, 200);
    }
    const childrenIds = myChildren.map((c) => c.id);
    // جلب الرحلات الجارية فقط (in_progress)
    const activeRides = await db_1.db
        .select({
        // Occurrence
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        status: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        currentLat: schema_1.rideOccurrences.currentLat,
        currentLng: schema_1.rideOccurrences.currentLng,
        // Ride
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        // Student
        studentId: schema_1.rideOccurrenceStudents.studentId,
        studentStatus: schema_1.rideOccurrenceStudents.status,
        pickupTime: schema_1.rideOccurrenceStudents.pickupTime,
        pickedUpAt: schema_1.rideOccurrenceStudents.pickedUpAt,
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
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, childrenIds), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress")));
    // تجميع مع بيانات الأطفال
    const formattedRides = activeRides.map((r) => {
        const child = myChildren.find((c) => c.id === r.studentId);
        return {
            occurrenceId: r.occurrenceId,
            date: r.occurDate,
            startedAt: r.startedAt,
            ride: {
                id: r.rideId,
                name: r.rideName,
                type: r.rideType,
            },
            child: {
                id: r.studentId,
                name: child?.name,
                avatar: child?.avatar,
                status: r.studentStatus,
                pickupTime: r.pickupTime,
                pickedUpAt: r.pickedUpAt,
            },
            bus: r.busId
                ? {
                    id: r.busId,
                    busNumber: r.busNumber,
                    plateNumber: r.plateNumber,
                    currentLocation: {
                        lat: r.currentLat,
                        lng: r.currentLng,
                    },
                }
                : null,
            driver: r.driverId
                ? {
                    id: r.driverId,
                    name: r.driverName,
                    phone: r.driverPhone,
                    avatar: r.driverAvatar,
                }
                : null,
            pickupPoint: r.pickupPointId
                ? {
                    id: r.pickupPointId,
                    name: r.pickupPointName,
                    lat: r.pickupPointLat,
                    lng: r.pickupPointLng,
                }
                : null,
        };
    });
    (0, response_1.SuccessResponse)(res, {
        activeRides: formattedRides,
        count: formattedRides.length,
    }, 200);
};
exports.getActiveRides = getActiveRides;
// ✅ Get Upcoming Rides (الرحلات القادمة)
const getUpcomingRides = async (req, res) => {
    const parentId = req.user?.id;
    const { days = 7 } = req.query;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    const myChildren = await db_1.db
        .select({ id: schema_1.students.id, name: schema_1.students.name, avatar: schema_1.students.avatar })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        return (0, response_1.SuccessResponse)(res, { upcomingRides: [], count: 0 }, 200);
    }
    const childrenIds = myChildren.map((c) => c.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + Number(days));
    const upcomingRides = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        status: schema_1.rideOccurrences.status,
        // Ride
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        // Student
        studentId: schema_1.rideOccurrenceStudents.studentId,
        pickupTime: schema_1.rideOccurrenceStudents.pickupTime,
        // Pickup Point
        pickupPointName: schema_1.pickupPoints.name,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, childrenIds), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, today), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, endDate), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "scheduled")))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.rideOccurrences.occurDate), (0, drizzle_orm_1.asc)(schema_1.rides.rideType));
    // تجميع حسب التاريخ
    const groupedByDate = upcomingRides.reduce((acc, r) => {
        const dateKey = new Date(r.occurDate).toISOString().split("T")[0];
        if (!acc[dateKey]) {
            acc[dateKey] = {
                date: dateKey,
                dayName: new Date(r.occurDate).toLocaleDateString("ar-EG", { weekday: "long" }),
                rides: [],
            };
        }
        const child = myChildren.find((c) => c.id === r.studentId);
        acc[dateKey].rides.push({
            occurrenceId: r.occurrenceId,
            ride: {
                id: r.rideId,
                name: r.rideName,
                type: r.rideType,
            },
            child: {
                id: r.studentId,
                name: child?.name,
                avatar: child?.avatar,
            },
            pickupTime: r.pickupTime,
            pickupPointName: r.pickupPointName,
        });
        return acc;
    }, {});
    (0, response_1.SuccessResponse)(res, {
        upcomingRides: Object.values(groupedByDate),
        totalDays: Object.keys(groupedByDate).length,
        totalRides: upcomingRides.length,
    }, 200);
};
exports.getUpcomingRides = getUpcomingRides;
// ✅ Get Ride History Summary (ملخص سجل الرحلات)
const getRideHistorySummary = async (req, res) => {
    const { childId } = req.params;
    const { month, year } = req.query;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    // تحقق إن الطالب ابن الـ Parent
    const [child] = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        organizationName: schema_1.organizations.name,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.students.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, childId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!child) {
        throw new NotFound_1.NotFound("Child not found");
    }
    // تحديد الفترة
    const targetYear = year ? Number(year) : new Date().getFullYear();
    const targetMonth = month ? Number(month) - 1 : new Date().getMonth();
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    // جلب الإحصائيات
    const ridesData = await db_1.db
        .select({
        status: schema_1.rideOccurrenceStudents.status,
        rideType: schema_1.rides.rideType,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, childId), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, startDate), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, endDate)));
    const summary = {
        total: ridesData.length,
        morning: ridesData.filter((r) => r.rideType === "morning").length,
        afternoon: ridesData.filter((r) => r.rideType === "afternoon").length,
        byStatus: {
            completed: ridesData.filter((r) => r.status === "picked_up" || r.status === "dropped_off").length,
            absent: ridesData.filter((r) => r.status === "absent").length,
            excused: ridesData.filter((r) => r.status === "excused").length,
            pending: ridesData.filter((r) => r.status === "pending").length,
        },
        attendanceRate: ridesData.length > 0
            ? Math.round(((ridesData.filter((r) => r.status === "picked_up" || r.status === "dropped_off").length /
                ridesData.length) *
                100))
            : 0,
    };
    (0, response_1.SuccessResponse)(res, {
        child: {
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            organization: child.organizationName,
        },
        period: {
            month: targetMonth + 1,
            year: targetYear,
            monthName: new Date(targetYear, targetMonth).toLocaleDateString("ar-EG", {
                month: "long",
            }),
        },
        summary,
    }, 200);
};
exports.getRideHistorySummary = getRideHistorySummary;
// ============ Helper Functions ============
function formatTodayRide(r) {
    return {
        occurrenceId: r.occurrenceId,
        status: r.occurrenceStatus,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        studentStatus: r.studentStatus,
        pickupTime: r.pickupTime,
        pickedUpAt: r.pickedUpAt,
        droppedOffAt: r.droppedOffAt,
        excuseReason: r.excuseReason,
        ride: {
            id: r.rideId,
            name: r.rideName,
            type: r.rideType,
        },
        bus: r.busId
            ? {
                id: r.busId,
                busNumber: r.busNumber,
                plateNumber: r.plateNumber,
                location: r.occurrenceStatus === "in_progress"
                    ? {
                        lat: r.currentLat,
                        lng: r.currentLng,
                    }
                    : null,
            }
            : null,
        driver: r.driverId
            ? {
                id: r.driverId,
                name: r.driverName,
                phone: r.driverPhone,
                avatar: r.driverAvatar,
            }
            : null,
        pickupPoint: r.pickupPointId
            ? {
                id: r.pickupPointId,
                name: r.pickupPointName,
                address: r.pickupPointAddress,
                lat: r.pickupPointLat,
                lng: r.pickupPointLng,
            }
            : null,
    };
}
