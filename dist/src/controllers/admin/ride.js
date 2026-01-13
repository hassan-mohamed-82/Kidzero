"use strict";
// src/controllers/admin/rideController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRidesByDate = exports.selection = exports.searchStudentsForRide = exports.removeStudentFromRide = exports.addStudentsToRide = exports.deleteRide = exports.updateRide = exports.getRideById = exports.getAllRides = exports.createRide = void 0;
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
    // جلب كل الرحلات
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
        startedAt: schema_1.rides.startedAt,
        completedAt: schema_1.rides.completedAt,
        createdAt: schema_1.rides.createdAt,
        // Bus
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        // Driver
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        // Codriver
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        // Route
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId))
        .orderBy((0, drizzle_orm_1.sql) `${schema_1.rides.startDate} DESC`);
    // جلب عدد الطلاب لكل رحلة
    const rideIds = allRides.map((r) => r.id);
    let studentsCountMap = {};
    if (rideIds.length > 0) {
        const studentsCounts = await db_1.db
            .select({
            rideId: schema_1.rideStudents.rideId,
            total: (0, drizzle_orm_1.sql) `COUNT(*)`,
            pending: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
            pickedUp: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
            droppedOff: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
            absent: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
            excused: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
        })
            .from(schema_1.rideStudents)
            .where((0, drizzle_orm_1.inArray)(schema_1.rideStudents.rideId, rideIds))
            .groupBy(schema_1.rideStudents.rideId);
        studentsCountMap = studentsCounts.reduce((acc, item) => {
            acc[item.rideId] = {
                total: Number(item.total) || 0,
                pending: Number(item.pending) || 0,
                pickedUp: Number(item.pickedUp) || 0,
                droppedOff: Number(item.droppedOff) || 0,
                absent: Number(item.absent) || 0,
                excused: Number(item.excused) || 0,
            };
            return acc;
        }, {});
    }
    // تاريخ اليوم
    const today = new Date().toISOString().split("T")[0];
    // Format ride function
    const formatRide = (ride) => {
        const stats = studentsCountMap[ride.id] || {
            total: 0, pending: 0, pickedUp: 0, droppedOff: 0, absent: 0, excused: 0,
        };
        return {
            id: ride.id,
            name: ride.name,
            type: ride.rideType,
            frequency: ride.frequency,
            startDate: ride.startDate,
            endDate: ride.endDate,
            isActive: ride.isActive,
            status: ride.status,
            startedAt: ride.startedAt,
            completedAt: ride.completedAt,
            bus: ride.busId
                ? { id: ride.busId, busNumber: ride.busNumber, plateNumber: ride.plateNumber }
                : null,
            driver: ride.driverId
                ? { id: ride.driverId, name: ride.driverName, phone: ride.driverPhone }
                : null,
            codriver: ride.codriverId
                ? { id: ride.codriverId, name: ride.codriverName }
                : null,
            route: ride.routeId
                ? { id: ride.routeId, name: ride.routeName }
                : null,
            students: stats,
        };
    };
    // تصنيف الرحلات
    const upcoming = []; // الرحلات القادمة
    const current = []; // الرحلات الحالية (اليوم + in_progress)
    const past = []; // الرحلات السابقة
    for (const ride of allRides) {
        const rideDate = ride.startDate?.toString();
        // الرحلات الجارية حالياً
        if (ride.status === "in_progress") {
            current.push(formatRide(ride));
        }
        // رحلات اليوم (scheduled)
        else if (rideDate === today && ride.status === "scheduled") {
            current.push(formatRide(ride));
        }
        // الرحلات القادمة
        else if (rideDate && rideDate > today && ride.status === "scheduled") {
            upcoming.push(formatRide(ride));
        }
        // الرحلات السابقة (completed, cancelled, أو تاريخ قديم)
        else {
            past.push(formatRide(ride));
        }
    }
    // ترتيب
    upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); // الأقرب أولاً
    past.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // الأحدث أولاً
    return (0, response_1.SuccessResponse)(res, {
        all: allRides.map(formatRide),
        upcoming,
        current,
        past,
        summary: {
            total: allRides.length,
            upcoming: upcoming.length,
            current: current.length,
            past: past.length,
        },
    }, 200);
};
exports.getAllRides = getAllRides;
// ✅ Get Ride By ID - Full Details
const getRideById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // 1) جلب بيانات الرحلة الأساسية
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
        // Bus
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        // Driver
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
        // Codriver
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        codriverPhone: schema_1.codrivers.phone,
        // Route
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.id, id), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId)))
        .limit(1);
    if (!ride[0]) {
        throw new NotFound_1.NotFound("Ride not found");
    }
    const rideData = ride[0];
    // 2) جلب كل الطلاب في الرحلة
    const allStudents = await db_1.db
        .select({
        id: schema_1.rideStudents.id,
        pickupTime: schema_1.rideStudents.pickupTime,
        status: schema_1.rideStudents.status,
        excuseReason: schema_1.rideStudents.excuseReason,
        pickedUpAt: schema_1.rideStudents.pickedUpAt,
        droppedOffAt: schema_1.rideStudents.droppedOffAt,
        // Student
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentAvatar: schema_1.students.avatar,
        studentGrade: schema_1.students.grade,
        studentClassroom: schema_1.students.classroom,
        // Parent
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        // Pickup Point
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointAddress: schema_1.pickupPoints.address,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
        stopOrder: schema_1.routePickupPoints.stopOrder,
    })
        .from(schema_1.rideStudents)
        .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .leftJoin(schema_1.routePickupPoints, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.rideStudents.pickupPointId), (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, rideData.routeId)))
        .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id))
        .orderBy(schema_1.routePickupPoints.stopOrder);
    // 3) تصنيف الطلاب حسب الحالة
    const formatStudent = (s) => ({
        id: s.id,
        pickupTime: s.pickupTime,
        status: s.status,
        excuseReason: s.excuseReason,
        pickedUpAt: s.pickedUpAt,
        droppedOffAt: s.droppedOffAt,
        student: {
            id: s.studentId,
            name: s.studentName,
            avatar: s.studentAvatar,
            grade: s.studentGrade,
            classroom: s.studentClassroom,
        },
        parent: {
            id: s.parentId,
            name: s.parentName,
            phone: s.parentPhone,
        },
        pickupPoint: {
            id: s.pickupPointId,
            name: s.pickupPointName,
            address: s.pickupPointAddress,
            lat: s.pickupPointLat,
            lng: s.pickupPointLng,
            stopOrder: s.stopOrder,
        },
    });
    // تصنيف الطلاب
    const pending = allStudents.filter((s) => s.status === "pending").map(formatStudent);
    const pickedUp = allStudents.filter((s) => s.status === "picked_up").map(formatStudent);
    const droppedOff = allStudents.filter((s) => s.status === "dropped_off").map(formatStudent);
    const absent = allStudents.filter((s) => s.status === "absent").map(formatStudent);
    const excused = allStudents.filter((s) => s.status === "excused").map(formatStudent);
    // 4) إحصائيات
    const stats = {
        total: allStudents.length,
        pending: pending.length,
        pickedUp: pickedUp.length,
        droppedOff: droppedOff.length,
        absent: absent.length,
        excused: excused.length,
        onBus: pickedUp.length, // الطلاب في الباص حالياً
    };
    // 5) حساب حالة الرحلة التفصيلية
    const today = new Date().toISOString().split("T")[0];
    const rideDate = rideData.startDate?.toString();
    let ridePhase;
    if (rideData.status === "cancelled") {
        ridePhase = "cancelled";
    }
    else if (rideData.status === "completed") {
        ridePhase = "completed";
    }
    else if (rideData.status === "in_progress") {
        ridePhase = "in_progress";
    }
    else if (rideDate && rideDate > today) {
        ridePhase = "upcoming";
    }
    else if (rideDate && rideDate === today) {
        ridePhase = "today";
    }
    else {
        ridePhase = "past";
    }
    // 6) جلب نقاط المسار بالترتيب
    let routeStops = [];
    if (rideData.routeId) {
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
            .innerJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, schema_1.routePickupPoints.pickupPointId))
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, rideData.routeId))
            .orderBy(schema_1.routePickupPoints.stopOrder);
        // إضافة عدد الطلاب في كل محطة وحالتهم
        routeStops = routeStops.map((stop) => {
            const studentsAtStop = allStudents.filter((s) => s.pickupPointId === stop.id);
            return {
                ...stop,
                studentsCount: studentsAtStop.length,
                pendingCount: studentsAtStop.filter((s) => s.status === "pending").length,
                pickedUpCount: studentsAtStop.filter((s) => s.status === "picked_up" || s.status === "dropped_off").length,
                absentCount: studentsAtStop.filter((s) => s.status === "absent" || s.status === "excused").length,
            };
        });
    }
    // 7) حساب مدة الرحلة
    let duration = null;
    if (rideData.startedAt && rideData.completedAt) {
        const start = new Date(rideData.startedAt).getTime();
        const end = new Date(rideData.completedAt).getTime();
        const diffMinutes = Math.round((end - start) / (1000 * 60));
        duration = {
            minutes: diffMinutes,
            formatted: `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`,
        };
    }
    // 8) بناء الـ Response
    const response = {
        ride: {
            id: rideData.id,
            name: rideData.name,
            type: rideData.rideType,
            frequency: rideData.frequency,
            repeatType: rideData.repeatType,
            startDate: rideData.startDate,
            endDate: rideData.endDate,
            isActive: rideData.isActive,
            status: rideData.status,
            phase: ridePhase,
            startedAt: rideData.startedAt,
            completedAt: rideData.completedAt,
            duration,
            currentLocation: rideData.currentLat && rideData.currentLng
                ? { lat: rideData.currentLat, lng: rideData.currentLng }
                : null,
            createdAt: rideData.createdAt,
        },
        bus: rideData.busId
            ? {
                id: rideData.busId,
                busNumber: rideData.busNumber,
                plateNumber: rideData.plateNumber,
            }
            : null,
        driver: rideData.driverId
            ? {
                id: rideData.driverId,
                name: rideData.driverName,
                phone: rideData.driverPhone,
                avatar: rideData.driverAvatar,
            }
            : null,
        codriver: rideData.codriverId
            ? {
                id: rideData.codriverId,
                name: rideData.codriverName,
                phone: rideData.codriverPhone,
            }
            : null,
        route: rideData.routeId
            ? {
                id: rideData.routeId,
                name: rideData.routeName,
                stops: routeStops,
            }
            : null,
        stats,
        students: {
            all: allStudents.map(formatStudent),
            pending, // في انتظار الصعود
            pickedUp, // تم استلامهم (في الباص)
            droppedOff, // تم توصيلهم
            absent, // غائبين
            excused, // معذورين
        },
    };
    return (0, response_1.SuccessResponse)(res, response, 200);
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
// ✅ Search Students by Parent Phone (for adding to ride)
const searchStudentsForRide = async (req, res) => {
    const { phone, name, parentName } = req.query;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!phone && !name && !parentName) {
        throw new BadRequest_1.BadRequest("Please provide phone, student name, or parent name to search");
    }
    let conditions = [(0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)];
    // البحث برقم تليفون ولي الأمر
    if (phone) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.parents.phone} LIKE ${`%${phone}%`}`);
    }
    // البحث باسم الطالب
    if (name) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.students.name} LIKE ${`%${name}%`}`);
    }
    // البحث باسم ولي الأمر
    if (parentName) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.parents.name} LIKE ${`%${parentName}%`}`);
    }
    const searchResults = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        parent: {
            id: schema_1.parents.id,
            name: schema_1.parents.name,
            phone: schema_1.parents.phone,
            avatar: schema_1.parents.avatar,
        },
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.and)(...conditions))
        .limit(20);
    (0, response_1.SuccessResponse)(res, {
        students: searchResults,
        count: searchResults.length,
    }, 200);
};
exports.searchStudentsForRide = searchStudentsForRide;
const selection = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allroutswithpickuppoints = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId));
    const routesWithPickupPoints = await Promise.all(allroutswithpickuppoints.map(async (route) => {
        const points = await db_1.db
            .select({
            id: schema_1.routePickupPoints.id,
            stopOrder: schema_1.routePickupPoints.stopOrder,
            pickupPoint: {
                id: schema_1.pickupPoints.id,
                name: schema_1.pickupPoints.name,
                address: schema_1.pickupPoints.address,
                lat: schema_1.pickupPoints.lat,
                lng: schema_1.pickupPoints.lng,
            },
        })
            .from(schema_1.routePickupPoints)
            .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.pickupPoints.id))
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, route.id));
        return { ...route, pickupPoints: points };
    }));
    const allbuses = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId));
    const alldrivers = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId));
    const allcodrivers = await db_1.db
        .select()
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId));
    const allstudents = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        parent: {
            id: schema_1.parents.id,
            name: schema_1.parents.name,
            phone: schema_1.parents.phone,
            avatar: schema_1.parents.avatar,
        },
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId));
    const getallparent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, {
        routes: routesWithPickupPoints,
        buses: allbuses,
        drivers: alldrivers,
        codrivers: allcodrivers,
        students: allstudents,
        parents: getallparent
    }, 200);
};
exports.selection = selection;
// ✅ Get Rides By Date
const getRidesByDate = async (req, res) => {
    const organizationId = req.user?.organizationId;
    const { date } = req.body; // YYYY-MM-DD
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!date) {
        throw new BadRequest_1.BadRequest("Date is required");
    }
    // جلب رحلات التاريخ المحدد
    const dayRides = await db_1.db
        .select({
        id: schema_1.rides.id,
        name: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        frequency: schema_1.rides.frequency,
        startDate: schema_1.rides.startDate,
        endDate: schema_1.rides.endDate,
        isActive: schema_1.rides.isActive,
        status: schema_1.rides.status,
        startedAt: schema_1.rides.startedAt,
        completedAt: schema_1.rides.completedAt,
        createdAt: schema_1.rides.createdAt,
        // Bus
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        // Driver
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
        // Codriver
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        codriverPhone: schema_1.codrivers.phone,
        // Route
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `${schema_1.rides.startDate} = ${date}`))
        .orderBy(schema_1.rides.rideType, schema_1.rides.createdAt);
    // جلب عدد الطلاب لكل رحلة
    const rideIds = dayRides.map((r) => r.id);
    let studentsCountMap = {};
    if (rideIds.length > 0) {
        const studentsCounts = await db_1.db
            .select({
            rideId: schema_1.rideStudents.rideId,
            total: (0, drizzle_orm_1.sql) `COUNT(*)`,
            pending: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
            pickedUp: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
            droppedOff: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
            absent: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
            excused: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
        })
            .from(schema_1.rideStudents)
            .where((0, drizzle_orm_1.inArray)(schema_1.rideStudents.rideId, rideIds))
            .groupBy(schema_1.rideStudents.rideId);
        studentsCountMap = studentsCounts.reduce((acc, item) => {
            acc[item.rideId] = {
                total: Number(item.total) || 0,
                pending: Number(item.pending) || 0,
                pickedUp: Number(item.pickedUp) || 0,
                droppedOff: Number(item.droppedOff) || 0,
                absent: Number(item.absent) || 0,
                excused: Number(item.excused) || 0,
            };
            return acc;
        }, {});
    }
    // Format ride
    const formatRide = (ride) => {
        const stats = studentsCountMap[ride.id] || {
            total: 0, pending: 0, pickedUp: 0, droppedOff: 0, absent: 0, excused: 0,
        };
        return {
            id: ride.id,
            name: ride.name,
            type: ride.rideType,
            frequency: ride.frequency,
            startDate: ride.startDate,
            endDate: ride.endDate,
            isActive: ride.isActive,
            status: ride.status,
            startedAt: ride.startedAt,
            completedAt: ride.completedAt,
            bus: ride.busId
                ? { id: ride.busId, busNumber: ride.busNumber, plateNumber: ride.plateNumber }
                : null,
            driver: ride.driverId
                ? { id: ride.driverId, name: ride.driverName, phone: ride.driverPhone, avatar: ride.driverAvatar }
                : null,
            codriver: ride.codriverId
                ? { id: ride.codriverId, name: ride.codriverName, phone: ride.codriverPhone }
                : null,
            route: ride.routeId
                ? { id: ride.routeId, name: ride.routeName }
                : null,
            students: stats,
        };
    };
    // تقسيم حسب النوع
    const morning = dayRides.filter((r) => r.rideType === "morning").map(formatRide);
    const afternoon = dayRides.filter((r) => r.rideType === "afternoon").map(formatRide);
    // تقسيم حسب الحالة
    const scheduled = dayRides.filter((r) => r.status === "scheduled").map(formatRide);
    const inProgress = dayRides.filter((r) => r.status === "in_progress").map(formatRide);
    const completed = dayRides.filter((r) => r.status === "completed").map(formatRide);
    const cancelled = dayRides.filter((r) => r.status === "cancelled").map(formatRide);
    // إحصائيات اليوم
    const totalStudents = Object.values(studentsCountMap).reduce((sum, s) => sum + s.total, 0);
    const totalPickedUp = Object.values(studentsCountMap).reduce((sum, s) => sum + s.pickedUp + s.droppedOff, 0);
    const totalAbsent = Object.values(studentsCountMap).reduce((sum, s) => sum + s.absent + s.excused, 0);
    return (0, response_1.SuccessResponse)(res, {
        date,
        rides: dayRides.map(formatRide),
        byType: {
            morning,
            afternoon,
        },
        byStatus: {
            scheduled,
            inProgress,
            completed,
            cancelled,
        },
        summary: {
            totalRides: dayRides.length,
            morning: morning.length,
            afternoon: afternoon.length,
            scheduled: scheduled.length,
            inProgress: inProgress.length,
            completed: completed.length,
            cancelled: cancelled.length,
            totalStudents,
            totalPickedUp,
            totalAbsent,
        },
    }, 200);
};
exports.getRidesByDate = getRidesByDate;
