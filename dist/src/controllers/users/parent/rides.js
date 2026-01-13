"use strict";
// src/controllers/mobile/parentController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportAbsence = exports.getChildAttendance = exports.trackRide = exports.getRideDetails = exports.getRidesHistory = exports.getTodayRides = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const Errors_1 = require("../../../Errors");
const BadRequest_1 = require("../../../Errors/BadRequest");
// ==========================================
// Helper: الحصول على بداية ونهاية اليوم
// ==========================================
const getTodayRange = () => {
    const now = new Date();
    // بداية اليوم (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // نهاية اليوم (23:59:59.999)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startOfDay, endOfDay };
};
// ==========================================
// Helper: تحويل التاريخ لصيغة MySQL
// ==========================================
const formatDateForMySQL = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};
const getTodayRides = async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    // 1) جلب الأبناء
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
        return (0, response_1.SuccessResponse)(res, { rides: [], message: "No children found" }, 200);
    }
    const childIds = myChildren.map((c) => c.id);
    // 2) جلب رحلات اليوم
    const todayRides = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        rideStatus: schema_1.rides.status,
        startDate: schema_1.rides.startDate,
        endDate: schema_1.rides.endDate,
        isActive: schema_1.rides.isActive,
        startedAt: schema_1.rides.startedAt,
        completedAt: schema_1.rides.completedAt,
        currentLat: schema_1.rides.currentLat,
        currentLng: schema_1.rides.currentLng,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        codriverPhone: schema_1.codrivers.phone,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
        studentId: schema_1.rideStudents.studentId,
        pickupPointId: schema_1.rideStudents.pickupPointId,
        pickupTime: schema_1.rideStudents.pickupTime,
        studentStatus: schema_1.rideStudents.status,
        excuseReason: schema_1.rideStudents.excuseReason,
        pickedUpAt: schema_1.rideStudents.pickedUpAt,
        droppedOffAt: schema_1.rideStudents.droppedOffAt,
    })
        .from(schema_1.rides)
        .innerJoin(schema_1.rideStudents, (0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.buses.id, schema_1.rides.busId))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.drivers.id, schema_1.rides.driverId))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.codrivers.id, schema_1.rides.codriverId))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.Rout.id, schema_1.rides.routeId))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, childIds), (0, drizzle_orm_1.sql) `${schema_1.rides.startDate} = CURDATE()`));
    if (todayRides.length === 0) {
        return (0, response_1.SuccessResponse)(res, { rides: [], message: "No rides today" }, 200);
    }
    // 3) تجميع الرحلات
    const ridesMap = new Map();
    for (const row of todayRides) {
        const child = myChildren.find((c) => c.id === row.studentId);
        if (!ridesMap.has(row.rideId)) {
            ridesMap.set(row.rideId, {
                id: row.rideId,
                name: row.rideName,
                type: row.rideType,
                status: row.rideStatus,
                startDate: row.startDate,
                endDate: row.endDate,
                isActive: row.isActive,
                startedAt: row.startedAt,
                completedAt: row.completedAt,
                currentLocation: row.currentLat && row.currentLng
                    ? { lat: row.currentLat, lng: row.currentLng }
                    : null,
                bus: row.busId
                    ? { id: row.busId, busNumber: row.busNumber, plateNumber: row.plateNumber }
                    : null,
                driver: row.driverId
                    ? { id: row.driverId, name: row.driverName, phone: row.driverPhone, avatar: row.driverAvatar }
                    : null,
                codriver: row.codriverId
                    ? { id: row.codriverId, name: row.codriverName, phone: row.codriverPhone }
                    : null,
                route: row.routeId
                    ? { id: row.routeId, name: row.routeName }
                    : null,
                children: [],
            });
        }
        if (child) {
            ridesMap.get(row.rideId).children.push({
                id: child.id,
                name: child.name,
                avatar: child.avatar,
                grade: child.grade,
                classroom: child.classroom,
                pickupPointId: row.pickupPointId,
                pickupTime: row.pickupTime,
                status: row.studentStatus,
                excuseReason: row.excuseReason,
                pickedUpAt: row.pickedUpAt,
                droppedOffAt: row.droppedOffAt,
            });
        }
    }
    const formattedRides = Array.from(ridesMap.values());
    return (0, response_1.SuccessResponse)(res, { rides: formattedRides, count: formattedRides.length }, 200);
};
exports.getTodayRides = getTodayRides;
// ==========================================
// 4. سجل الرحلات السابقة
// ==========================================
const getRidesHistory = async (req, res) => {
    const parentId = req.user?.id;
    const { childId, page = "1", limit = "20" } = req.query;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const myChildren = await db_1.db
        .select({ id: schema_1.students.id, name: schema_1.students.name })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        return (0, response_1.SuccessResponse)(res, { rides: [], total: 0 }, 200);
    }
    let targetChildIds = myChildren.map((c) => c.id);
    if (childId && typeof childId === "string") {
        const isMyChild = myChildren.some((c) => c.id === childId);
        if (!isMyChild) {
            throw new Errors_1.NotFound("Child not found");
        }
        targetChildIds = [childId];
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const historyRides = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        rideStatus: schema_1.rides.status,
        startDate: schema_1.rides.startDate,
        completedAt: schema_1.rides.completedAt,
        busNumber: schema_1.buses.busNumber,
        driverName: schema_1.drivers.name,
        routeName: schema_1.Rout.name,
        studentId: schema_1.rideStudents.studentId,
        studentStatus: schema_1.rideStudents.status,
        pickedUpAt: schema_1.rideStudents.pickedUpAt,
        droppedOffAt: schema_1.rideStudents.droppedOffAt,
    })
        .from(schema_1.rides)
        .innerJoin(schema_1.rideStudents, (0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.buses.id, schema_1.rides.busId))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.drivers.id, schema_1.rides.driverId))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.Rout.id, schema_1.rides.routeId))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, targetChildIds), (0, drizzle_orm_1.sql) `${schema_1.rides.startDate} < CURDATE()`))
        .orderBy((0, drizzle_orm_1.sql) `${schema_1.rides.startDate} DESC`)
        .limit(limitNum)
        .offset(offset);
    const ridesWithChild = historyRides.map((r) => ({
        ...r,
        childName: myChildren.find((c) => c.id === r.studentId)?.name || "Unknown",
    }));
    return (0, response_1.SuccessResponse)(res, {
        rides: ridesWithChild,
        page: pageNum,
        limit: limitNum,
    }, 200);
};
exports.getRidesHistory = getRidesHistory;
// ==========================================
// 5. تفاصيل رحلة
// ==========================================
const getRideDetails = async (req, res) => {
    const parentId = req.user?.id;
    const { rideId } = req.params;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const myChildren = await db_1.db
        .select({ id: schema_1.students.id, name: schema_1.students.name })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        throw new Errors_1.NotFound("No children found");
    }
    const childIds = myChildren.map((c) => c.id);
    const childInRide = await db_1.db
        .select({ studentId: schema_1.rideStudents.studentId })
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId), (0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, childIds)))
        .limit(1);
    if (childInRide.length === 0) {
        throw new Errors_1.NotFound("Ride not found or not associated with your children");
    }
    const rideData = await db_1.db
        .select({
        id: schema_1.rides.id,
        name: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        status: schema_1.rides.status,
        startDate: schema_1.rides.startDate,
        endDate: schema_1.rides.endDate,
        isActive: schema_1.rides.isActive,
        startedAt: schema_1.rides.startedAt,
        completedAt: schema_1.rides.completedAt,
        currentLat: schema_1.rides.currentLat,
        currentLng: schema_1.rides.currentLng,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        maxSeats: schema_1.buses.maxSeats,
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        codriverPhone: schema_1.codrivers.phone,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.buses.id, schema_1.rides.busId))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.drivers.id, schema_1.rides.driverId))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.codrivers.id, schema_1.rides.codriverId))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.Rout.id, schema_1.rides.routeId))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.id, rideId));
    if (rideData.length === 0) {
        throw new Errors_1.NotFound("Ride not found");
    }
    const ride = rideData[0];
    const myChildrenInRide = await db_1.db
        .select({
        studentId: schema_1.rideStudents.studentId,
        pickupPointId: schema_1.rideStudents.pickupPointId,
        pickupTime: schema_1.rideStudents.pickupTime,
        status: schema_1.rideStudents.status,
        excuseReason: schema_1.rideStudents.excuseReason,
        pickedUpAt: schema_1.rideStudents.pickedUpAt,
        droppedOffAt: schema_1.rideStudents.droppedOffAt,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointAddress: schema_1.pickupPoints.address,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
    })
        .from(schema_1.rideStudents)
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.pickupPoints.id, schema_1.rideStudents.pickupPointId))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId), (0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, childIds)));
    const childrenDetails = myChildrenInRide.map((rs) => {
        const child = myChildren.find((c) => c.id === rs.studentId);
        return {
            id: rs.studentId,
            name: child?.name || "Unknown",
            pickupPoint: rs.pickupPointId
                ? {
                    id: rs.pickupPointId,
                    name: rs.pickupPointName,
                    address: rs.pickupPointAddress,
                    lat: rs.pickupPointLat,
                    lng: rs.pickupPointLng,
                }
                : null,
            pickupTime: rs.pickupTime,
            status: rs.status,
            excuseReason: rs.excuseReason,
            pickedUpAt: rs.pickedUpAt,
            droppedOffAt: rs.droppedOffAt,
        };
    });
    let routeStops = [];
    if (ride.routeId) {
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
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, ride.routeId))
            .orderBy(schema_1.routePickupPoints.stopOrder);
    }
    return (0, response_1.SuccessResponse)(res, {
        ride: {
            id: ride.id,
            name: ride.name,
            type: ride.rideType,
            status: ride.status,
            startDate: ride.startDate,
            endDate: ride.endDate,
            isActive: ride.isActive,
            startedAt: ride.startedAt,
            completedAt: ride.completedAt,
            currentLocation: ride.currentLat && ride.currentLng
                ? { lat: ride.currentLat, lng: ride.currentLng }
                : null,
            bus: ride.busId
                ? { id: ride.busId, busNumber: ride.busNumber, plateNumber: ride.plateNumber, maxSeats: ride.maxSeats }
                : null,
            driver: ride.driverId
                ? { id: ride.driverId, name: ride.driverName, phone: ride.driverPhone, avatar: ride.driverAvatar }
                : null,
            codriver: ride.codriverId
                ? { id: ride.codriverId, name: ride.codriverName, phone: ride.codriverPhone }
                : null,
            route: ride.routeId
                ? { id: ride.routeId, name: ride.routeName, stops: routeStops }
                : null,
            myChildren: childrenDetails,
        },
    }, 200);
};
exports.getRideDetails = getRideDetails;
// ==========================================
// 6. تتبع الرحلة مباشر
// ==========================================
const trackRide = async (req, res) => {
    const parentId = req.user?.id;
    const { rideId } = req.params;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const myChildren = await db_1.db
        .select({ id: schema_1.students.id })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (myChildren.length === 0) {
        throw new Errors_1.NotFound("No children found");
    }
    const childIds = myChildren.map((c) => c.id);
    const childInRide = await db_1.db
        .select({ studentId: schema_1.rideStudents.studentId })
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId), (0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, childIds)))
        .limit(1);
    if (childInRide.length === 0) {
        throw new Errors_1.NotFound("Ride not found");
    }
    const rideLocation = await db_1.db
        .select({
        id: schema_1.rides.id,
        status: schema_1.rides.status,
        isActive: schema_1.rides.isActive,
        currentLat: schema_1.rides.currentLat,
        currentLng: schema_1.rides.currentLng,
        startedAt: schema_1.rides.startedAt,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.drivers.id, schema_1.rides.driverId))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.id, rideId));
    if (rideLocation.length === 0) {
        throw new Errors_1.NotFound("Ride not found");
    }
    const ride = rideLocation[0];
    return (0, response_1.SuccessResponse)(res, {
        rideId: ride.id,
        status: ride.status,
        isActive: ride.isActive,
        location: ride.currentLat && ride.currentLng
            ? { lat: ride.currentLat, lng: ride.currentLng }
            : null,
        startedAt: ride.startedAt,
        driver: { name: ride.driverName, phone: ride.driverPhone },
    }, 200);
};
exports.trackRide = trackRide;
// ==========================================
// 7. سجل حضور الطفل
// ==========================================
const getChildAttendance = async (req, res) => {
    const parentId = req.user?.id;
    const { childId } = req.params;
    const { startDate, endDate, page = "1", limit = "20" } = req.query;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const child = await db_1.db
        .select({ id: schema_1.students.id, name: schema_1.students.name })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, childId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)));
    if (child.length === 0) {
        throw new Errors_1.NotFound("Child not found");
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    // ✅ بناء الشروط بشكل ديناميكي
    const conditions = [(0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, childId)];
    // ✅ تحويل string إلى Date
    if (startDate && typeof startDate === "string") {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.rides.startDate, new Date(startDate)));
    }
    if (endDate && typeof endDate === "string") {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.rides.startDate, new Date(endDate)));
    }
    const attendance = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        rideDate: schema_1.rides.startDate,
        status: schema_1.rideStudents.status,
        excuseReason: schema_1.rideStudents.excuseReason,
        pickedUpAt: schema_1.rideStudents.pickedUpAt,
        droppedOffAt: schema_1.rideStudents.droppedOffAt,
    })
        .from(schema_1.rideStudents)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rides.id, schema_1.rideStudents.rideId))
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.sql) `${schema_1.rides.startDate} DESC`)
        .limit(limitNum)
        .offset(offset);
    const stats = {
        total: attendance.length,
        pickedUp: attendance.filter((a) => a.status === "picked_up" || a.status === "dropped_off").length,
        absent: attendance.filter((a) => a.status === "absent").length,
        excused: attendance.filter((a) => a.status === "excused").length,
    };
    return (0, response_1.SuccessResponse)(res, {
        child: child[0],
        attendance,
        stats,
        page: pageNum,
        limit: limitNum,
    }, 200);
};
exports.getChildAttendance = getChildAttendance;
// ==========================================
// 8. تسجيل عذر غياب
// ==========================================
const reportAbsence = async (req, res) => {
    const parentId = req.user?.id;
    const { childId } = req.params;
    const { rideId, reason } = req.body;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("Not authenticated");
    }
    const child = await db_1.db
        .select({ id: schema_1.students.id })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, childId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)));
    if (child.length === 0) {
        throw new Errors_1.NotFound("Child not found");
    }
    const rideStudent = await db_1.db
        .select({ id: schema_1.rideStudents.id, status: schema_1.rideStudents.status })
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId), (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, childId)));
    if (rideStudent.length === 0) {
        throw new Errors_1.NotFound("Child is not in this ride");
    }
    if (rideStudent[0].status === "picked_up" || rideStudent[0].status === "dropped_off") {
        throw new BadRequest_1.BadRequest("Cannot report absence for a child who has already been picked up");
    }
    await db_1.db
        .update(schema_1.rideStudents)
        .set({
        status: "excused",
        excuseReason: reason || "Parent reported absence",
    })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId), (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, childId)));
    return (0, response_1.SuccessResponse)(res, {
        message: "Absence reported successfully",
        rideId,
        childId,
        status: "excused",
        reason: reason || "Parent reported absence",
    }, 200);
};
exports.reportAbsence = reportAbsence;
