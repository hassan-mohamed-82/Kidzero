"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRidesDashboard = exports.getCurrentRides = exports.searchStudentsForRide = exports.selection = exports.updateOccurrenceStatus = exports.deleteRide = exports.updateRide = exports.getOccurrenceDetails = exports.getUpcomingRides = exports.getRidesByDate = exports.getRideById = exports.getAllRides = exports.createRide = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const uuid_1 = require("uuid");
// ================== HELPERS ==================
const checkBusCapacity = async (busId, rideId, newStudentsCount) => {
    const [bus] = await db_1.db
        .select({ maxSeats: schema_1.buses.maxSeats })
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.eq)(schema_1.buses.id, busId))
        .limit(1);
    if (!bus) {
        throw new NotFound_1.NotFound("Bus not found");
    }
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
        throw new BadRequest_1.BadRequest(`Bus capacity exceeded. Max: ${bus.maxSeats}, Current: ${currentStudentsCount}, Trying to add: ${newStudentsCount}`);
    }
};
const generateOccurrences = async (rideId, startDate, endDate, frequency, repeatType, studentsData) => {
    const occurrences = [];
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (frequency === "once") {
        occurrences.push({
            id: (0, uuid_1.v4)(),
            rideId,
            occurDate: startDate,
        });
    }
    else if (frequency === "repeat") {
        let generateUntil;
        if (repeatType === "limited" && endDate) {
            generateUntil = new Date(endDate);
        }
        else {
            // ✅ unlimited: توليد 30 يوم من اليوم أو startDate (الأكبر)
            generateUntil = new Date(Math.max(today.getTime(), start.getTime()));
            generateUntil.setDate(generateUntil.getDate() + 30);
        }
        const current = new Date(start);
        while (current <= generateUntil) {
            occurrences.push({
                id: (0, uuid_1.v4)(),
                rideId,
                occurDate: current.toISOString().split("T")[0],
            });
            current.setDate(current.getDate() + 1);
        }
    }
    if (occurrences.length > 0) {
        await db_1.db.insert(schema_1.rideOccurrences).values(occurrences);
        for (const occ of occurrences) {
            if (studentsData.length > 0) {
                const occStudents = studentsData.map((s) => ({
                    id: (0, uuid_1.v4)(),
                    occurrenceId: occ.id,
                    studentId: s.studentId,
                    pickupPointId: s.pickupPointId,
                    pickupTime: s.pickupTime || null,
                }));
                await db_1.db.insert(schema_1.rideOccurrenceStudents).values(occStudents);
            }
        }
    }
    return occurrences.length;
};
// ================== CONTROLLERS ==================
// ✅ Create Ride
const createRide = async (req, res) => {
    const { busId, driverId, codriverId, routeId, name, rideType, frequency, repeatType, startDate, endDate, students: rideStudentsData = [], } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!busId || !driverId || !routeId || !rideType || !frequency || !startDate) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    // ✅ التحقق من frequency و repeatType
    if (frequency === "repeat") {
        if (!repeatType) {
            throw new BadRequest_1.BadRequest("Repeat type is required for repeating rides");
        }
        if (repeatType === "limited") {
            if (!endDate) {
                throw new BadRequest_1.BadRequest("End date is required for limited repeat rides");
            }
            if (new Date(endDate) <= new Date(startDate)) {
                throw new BadRequest_1.BadRequest("End date must be after start date");
            }
        }
        if (repeatType === "unlimited" && endDate) {
            console.log("Warning: endDate ignored for unlimited rides");
        }
    }
    // ✅ حساب نطاق التواريخ للفحص
    const checkStartDate = new Date(startDate);
    let checkEndDate;
    if (frequency === "once") {
        checkEndDate = checkStartDate;
    }
    else if (frequency === "repeat" && repeatType === "limited" && endDate) {
        checkEndDate = new Date(endDate);
    }
    else {
        // unlimited: نفحص 30 يوم قدام
        checkEndDate = new Date(checkStartDate);
        checkEndDate.setDate(checkEndDate.getDate() + 30);
    }
    const formatDate = (d) => d.toISOString().split("T")[0];
    // ✅ 1) فحص تعارض السائق
    const driverConflict = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        occurDate: schema_1.rideOccurrences.occurDate,
    })
        .from(schema_1.rides)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rides.id, schema_1.rideOccurrences.rideId))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.driverId, driverId), (0, drizzle_orm_1.eq)(schema_1.rides.rideType, rideType), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, checkStartDate), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, checkEndDate), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.status, ["scheduled", "in_progress"])))
        .limit(1);
    if (driverConflict.length > 0) {
        const conflict = driverConflict[0];
        throw new BadRequest_1.BadRequest(`Driver is already assigned to ride "${conflict.rideName || conflict.rideId}" on ${conflict.occurDate} (${conflict.rideType})`);
    }
    // ✅ 2) فحص تعارض الكو-درايفر
    if (codriverId) {
        const codriverConflict = await db_1.db
            .select({
            rideId: schema_1.rides.id,
            rideName: schema_1.rides.name,
            rideType: schema_1.rides.rideType,
            occurDate: schema_1.rideOccurrences.occurDate,
        })
            .from(schema_1.rides)
            .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rides.id, schema_1.rideOccurrences.rideId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, codriverId), (0, drizzle_orm_1.eq)(schema_1.rides.rideType, rideType), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, checkStartDate), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, checkEndDate), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.status, ["scheduled", "in_progress"])))
            .limit(1);
        if (codriverConflict.length > 0) {
            const conflict = codriverConflict[0];
            throw new BadRequest_1.BadRequest(`Codriver is already assigned to ride "${conflict.rideName || conflict.rideId}" on ${conflict.occurDate} (${conflict.rideType})`);
        }
    }
    // ✅ 3) فحص تعارض الباص
    const busConflict = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        occurDate: schema_1.rideOccurrences.occurDate,
    })
        .from(schema_1.rides)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rides.id, schema_1.rideOccurrences.rideId))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.busId, busId), (0, drizzle_orm_1.eq)(schema_1.rides.rideType, rideType), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, checkStartDate), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, checkEndDate), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.status, ["scheduled", "in_progress"])))
        .limit(1);
    if (busConflict.length > 0) {
        const conflict = busConflict[0];
        throw new BadRequest_1.BadRequest(`Bus is already assigned to ride "${conflict.rideName || conflict.rideId}" on ${conflict.occurDate} (${conflict.rideType})`);
    }
    // ✅ 4) فحص تعارض الطلاب
    if (rideStudentsData.length > 0) {
        const studentIds = rideStudentsData.map((s) => s.studentId);
        const studentConflicts = await db_1.db
            .select({
            studentId: schema_1.rideStudents.studentId,
            studentName: schema_1.students.name,
            rideName: schema_1.rides.name,
            rideType: schema_1.rides.rideType,
            occurDate: schema_1.rideOccurrences.occurDate,
        })
            .from(schema_1.rideStudents)
            .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, schema_1.rides.id))
            .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rides.id, schema_1.rideOccurrences.rideId))
            .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, schema_1.students.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.rideType, rideType), (0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, studentIds), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, checkStartDate), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, checkEndDate), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.status, ["scheduled", "in_progress"])))
            .limit(5);
        if (studentConflicts.length > 0) {
            const conflictNames = studentConflicts
                .map((c) => `${c.studentName} (${c.occurDate})`)
                .join(", ");
            throw new BadRequest_1.BadRequest(`Students already assigned to another ${rideType} ride: ${conflictNames}`);
        }
    }
    // ✅ التحقق من وجود الموارد
    const bus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, busId), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!bus[0])
        throw new NotFound_1.NotFound("Bus not found");
    if (rideStudentsData.length > 0) {
        await checkBusCapacity(busId, null, rideStudentsData.length);
    }
    const driver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, driverId), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!driver[0])
        throw new NotFound_1.NotFound("Driver not found");
    if (codriverId) {
        const codriver = await db_1.db
            .select()
            .from(schema_1.codrivers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.codrivers.id, codriverId), (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId)))
            .limit(1);
        if (!codriver[0])
            throw new NotFound_1.NotFound("Codriver not found");
    }
    const route = await db_1.db
        .select()
        .from(schema_1.Rout)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.id, routeId), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId)))
        .limit(1);
    if (!route[0])
        throw new NotFound_1.NotFound("Route not found");
    // ✅ التحقق من الطلاب ونقاط الالتقاط
    if (rideStudentsData.length > 0) {
        const routePickupPointsList = await db_1.db
            .select()
            .from(schema_1.routePickupPoints)
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, routeId));
        const validPickupPointIds = routePickupPointsList.map((p) => p.pickupPointId);
        const studentIds = rideStudentsData.map((s) => s.studentId);
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
    }
    // ✅ إنشاء الرحلة
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
        repeatType: frequency === "repeat" ? repeatType : null,
        startDate,
        endDate: frequency === "repeat" && repeatType === "limited" ? endDate : null,
    });
    if (rideStudentsData.length > 0) {
        const rideStudentsInsert = rideStudentsData.map((s) => ({
            id: (0, uuid_1.v4)(),
            rideId,
            studentId: s.studentId,
            pickupPointId: s.pickupPointId,
            pickupTime: s.pickupTime || null,
        }));
        await db_1.db.insert(schema_1.rideStudents).values(rideStudentsInsert);
    }
    const occurrencesCount = await generateOccurrences(rideId, startDate, frequency === "repeat" && repeatType === "limited" ? endDate : null, frequency, repeatType, rideStudentsData);
    (0, response_1.SuccessResponse)(res, {
        message: "Ride created successfully",
        rideId,
        frequency,
        repeatType: repeatType || null,
        studentsCount: rideStudentsData.length,
        occurrencesGenerated: occurrencesCount,
    }, 201);
};
exports.createRide = createRide;
// ✅ Get All Rides with Classification
const getAllRides = async (req, res) => {
    const organizationId = req.user?.organizationId;
    const { tab } = req.query;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const today = new Date().toISOString().split("T")[0];
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
        createdAt: schema_1.rides.createdAt,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.rides.createdAt));
    const rideIds = allRides.map((r) => r.id);
    let studentsCountMap = {};
    if (rideIds.length > 0) {
        const studentsCounts = await db_1.db
            .select({
            rideId: schema_1.rideStudents.rideId,
            count: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.rideStudents)
            .where((0, drizzle_orm_1.inArray)(schema_1.rideStudents.rideId, rideIds))
            .groupBy(schema_1.rideStudents.rideId);
        studentsCountMap = studentsCounts.reduce((acc, item) => {
            acc[item.rideId] = item.count;
            return acc;
        }, {});
    }
    let todayOccurrenceMap = {};
    if (rideIds.length > 0) {
        const todayOccurrences = await db_1.db
            .select({
            rideId: schema_1.rideOccurrences.rideId,
            occurrenceId: schema_1.rideOccurrences.id,
            status: schema_1.rideOccurrences.status,
            startedAt: schema_1.rideOccurrences.startedAt,
            completedAt: schema_1.rideOccurrences.completedAt,
        })
            .from(schema_1.rideOccurrences)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.rideId, rideIds), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${today}`));
        todayOccurrenceMap = todayOccurrences.reduce((acc, item) => {
            acc[item.rideId] = {
                occurrenceId: item.occurrenceId,
                status: item.status,
                startedAt: item.startedAt,
                completedAt: item.completedAt,
            };
            return acc;
        }, {});
    }
    let nextOccurrenceMap = {};
    if (rideIds.length > 0) {
        const nextOccurrences = await db_1.db
            .select({
            rideId: schema_1.rideOccurrences.rideId,
            occurDate: (0, drizzle_orm_1.sql) `MIN(DATE(${schema_1.rideOccurrences.occurDate}))`,
        })
            .from(schema_1.rideOccurrences)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.rideId, rideIds), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) > ${today}`, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "scheduled")))
            .groupBy(schema_1.rideOccurrences.rideId);
        nextOccurrenceMap = nextOccurrences.reduce((acc, item) => {
            acc[item.rideId] = item.occurDate;
            return acc;
        }, {});
    }
    const formatRide = (ride) => {
        const todayOcc = todayOccurrenceMap[ride.id];
        const nextOccDate = nextOccurrenceMap[ride.id];
        let classification;
        let currentStatus = null;
        if (todayOcc) {
            currentStatus = todayOcc.status;
            if (todayOcc.status === "in_progress") {
                classification = "current";
            }
            else if (todayOcc.status === "scheduled") {
                classification = "current";
            }
            else if (todayOcc.status === "completed" || todayOcc.status === "cancelled") {
                // ✅ الرحلة خلصت/اتلغت النهارده - شوف لو فيه قادمة
                if (nextOccDate) {
                    classification = "upcoming";
                }
                else {
                    classification = "past";
                }
            }
            else {
                classification = "past";
            }
        }
        else if (nextOccDate) {
            classification = "upcoming";
        }
        else {
            classification = "past";
        }
        return {
            id: ride.id,
            name: ride.name,
            type: ride.rideType,
            frequency: ride.frequency,
            repeatType: ride.repeatType,
            startDate: ride.startDate,
            endDate: ride.endDate || null,
            isActive: ride.isActive,
            createdAt: ride.createdAt,
            classification,
            todayOccurrence: todayOcc || null,
            nextOccurrenceDate: nextOccDate || null,
            currentStatus,
            bus: ride.busId
                ? { id: ride.busId, busNumber: ride.busNumber, plateNumber: ride.plateNumber }
                : null,
            driver: ride.driverId
                ? { id: ride.driverId, name: ride.driverName }
                : null,
            codriver: ride.codriverId
                ? { id: ride.codriverId, name: ride.codriverName }
                : null,
            route: ride.routeId
                ? { id: ride.routeId, name: ride.routeName }
                : null,
            studentsCount: studentsCountMap[ride.id] || 0,
        };
    };
    const formattedRides = allRides.map(formatRide);
    const upcoming = formattedRides.filter((r) => r.classification === "upcoming");
    const current = formattedRides.filter((r) => r.classification === "current");
    const past = formattedRides.filter((r) => r.classification === "past");
    // ✅ ترتيب الـ upcoming حسب التاريخ (الأقرب أولاً)
    upcoming.sort((a, b) => {
        const dateA = a.nextOccurrenceDate || a.startDate;
        const dateB = b.nextOccurrenceDate || b.startDate;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    // ✅ ترتيب الـ current حسب الحالة (in_progress أولاً)
    const statusOrder = {
        in_progress: 1,
        scheduled: 2,
        completed: 3,
        cancelled: 4,
    };
    current.sort((a, b) => {
        const orderA = statusOrder[a.currentStatus || ""] || 5;
        const orderB = statusOrder[b.currentStatus || ""] || 5;
        return orderA - orderB;
    });
    // ✅ ترتيب الـ past حسب التاريخ (الأحدث أولاً)
    past.sort((a, b) => {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
    let result = formattedRides;
    if (tab === "upcoming") {
        result = upcoming;
    }
    else if (tab === "current") {
        result = current;
    }
    else if (tab === "past") {
        result = past;
    }
    (0, response_1.SuccessResponse)(res, {
        rides: result,
        all: formattedRides,
        upcoming,
        current,
        past,
        summary: {
            all: formattedRides.length,
            upcoming: upcoming.length,
            current: current.length,
            past: past.length,
        },
    }, 200);
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
        createdAt: schema_1.rides.createdAt,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        busMaxSeats: schema_1.buses.maxSeats,
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
    const rideStudentsList = await db_1.db
        .select({
        id: schema_1.rideStudents.id,
        pickupTime: schema_1.rideStudents.pickupTime,
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentAvatar: schema_1.students.avatar,
        studentGrade: schema_1.students.grade,
        studentClassroom: schema_1.students.classroom,
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointAddress: schema_1.pickupPoints.address,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
    })
        .from(schema_1.rideStudents)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id));
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
    }
    const recentOccurrences = await db_1.db
        .select()
        .from(schema_1.rideOccurrences)
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.rideOccurrences.occurDate))
        .limit(10);
    (0, response_1.SuccessResponse)(res, {
        ride: {
            id: rideData.id,
            name: rideData.name,
            type: rideData.rideType,
            frequency: rideData.frequency,
            repeatType: rideData.repeatType,
            startDate: rideData.startDate,
            // ✅ إصلاح endDate
            endDate: rideData.endDate || null,
            isActive: rideData.isActive,
            createdAt: rideData.createdAt,
        },
        bus: rideData.busId
            ? {
                id: rideData.busId,
                busNumber: rideData.busNumber,
                plateNumber: rideData.plateNumber,
                maxSeats: rideData.busMaxSeats,
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
        students: rideStudentsList.map((s) => ({
            id: s.id,
            pickupTime: s.pickupTime,
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
            },
        })),
        studentsCount: rideStudentsList.length,
        recentOccurrences,
    }, 200);
};
exports.getRideById = getRideById;
// ✅ Get Rides By Date (Occurrences)
const getRidesByDate = async (req, res) => {
    const organizationId = req.user?.organizationId;
    const { date } = req.body;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const targetDate = date ? String(date) : new Date().toISOString().split("T")[0];
    const dayOccurrences = await db_1.db
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
        frequency: schema_1.rides.frequency,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.isActive, "on"), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${targetDate}`))
        .orderBy(schema_1.rides.rideType, schema_1.rideOccurrences.createdAt);
    const occurrenceIds = dayOccurrences.map((o) => o.occurrenceId);
    let studentsStatsMap = {};
    if (occurrenceIds.length > 0) {
        const studentsStats = await db_1.db
            .select({
            occurrenceId: schema_1.rideOccurrenceStudents.occurrenceId,
            total: (0, drizzle_orm_1.sql) `COUNT(*)`,
            pending: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
            pickedUp: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
            droppedOff: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
            absent: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
            excused: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
        })
            .from(schema_1.rideOccurrenceStudents)
            .where((0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.occurrenceId, occurrenceIds))
            .groupBy(schema_1.rideOccurrenceStudents.occurrenceId);
        studentsStatsMap = studentsStats.reduce((acc, item) => {
            acc[item.occurrenceId] = {
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
    const formatOccurrence = (occ) => {
        const stats = studentsStatsMap[occ.occurrenceId] || {
            total: 0, pending: 0, pickedUp: 0, droppedOff: 0, absent: 0, excused: 0,
        };
        return {
            id: occ.occurrenceId,
            date: occ.occurDate,
            status: occ.occurrenceStatus,
            startedAt: occ.startedAt,
            completedAt: occ.completedAt,
            currentLocation: occ.currentLat && occ.currentLng
                ? { lat: occ.currentLat, lng: occ.currentLng }
                : null,
            ride: {
                id: occ.rideId,
                name: occ.rideName,
                type: occ.rideType,
                frequency: occ.frequency,
            },
            bus: occ.busId
                ? { id: occ.busId, busNumber: occ.busNumber, plateNumber: occ.plateNumber }
                : null,
            driver: occ.driverId
                ? { id: occ.driverId, name: occ.driverName, phone: occ.driverPhone, avatar: occ.driverAvatar }
                : null,
            codriver: occ.codriverId
                ? { id: occ.codriverId, name: occ.codriverName }
                : null,
            route: occ.routeId
                ? { id: occ.routeId, name: occ.routeName }
                : null,
            students: stats,
        };
    };
    const allFormatted = dayOccurrences.map(formatOccurrence);
    const morning = allFormatted.filter((o) => o.ride.type === "morning");
    const afternoon = allFormatted.filter((o) => o.ride.type === "afternoon");
    const scheduled = allFormatted.filter((o) => o.status === "scheduled");
    const inProgress = allFormatted.filter((o) => o.status === "in_progress");
    const completed = allFormatted.filter((o) => o.status === "completed");
    const cancelled = allFormatted.filter((o) => o.status === "cancelled");
    (0, response_1.SuccessResponse)(res, {
        date: targetDate,
        occurrences: allFormatted,
        byType: { morning, afternoon },
        byStatus: { scheduled, inProgress, completed, cancelled },
        summary: {
            total: allFormatted.length,
            morning: morning.length,
            afternoon: afternoon.length,
            scheduled: scheduled.length,
            inProgress: inProgress.length,
            completed: completed.length,
            cancelled: cancelled.length,
        },
    }, 200);
};
exports.getRidesByDate = getRidesByDate;
// ✅ Get Upcoming Rides
const getUpcomingRides = async (req, res) => {
    const organizationId = req.user?.organizationId;
    const { limit = 20 } = req.query;
    const today = new Date().toISOString().split("T")[0];
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
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
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.isActive, "on"), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) >= ${today}`, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "scheduled")))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.rideOccurrences.occurDate))
        .limit(Number(limit));
    const result = upcomingOccurrences.map((occ) => ({
        id: occ.occurrenceId,
        date: occ.occurDate,
        status: occ.occurrenceStatus,
        ride: {
            id: occ.rideId,
            name: occ.rideName,
            type: occ.rideType,
        },
        bus: occ.busId ? { id: occ.busId, busNumber: occ.busNumber } : null,
        driver: occ.driverId ? { id: occ.driverId, name: occ.driverName } : null,
        route: occ.routeId ? { id: occ.routeId, name: occ.routeName } : null,
    }));
    (0, response_1.SuccessResponse)(res, { upcoming: result, count: result.length }, 200);
};
exports.getUpcomingRides = getUpcomingRides;
// ✅ Get Occurrence Details
const getOccurrenceDetails = async (req, res) => {
    const { occurrenceId } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
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
        frequency: schema_1.rides.frequency,
        repeatType: schema_1.rides.repeatType,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        busMaxSeats: schema_1.buses.maxSeats,
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
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId)))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Occurrence not found");
    }
    const occ = occurrence[0];
    const occId = occ.occurrenceId;
    const occStudents = await db_1.db
        .select({
        id: schema_1.rideOccurrenceStudents.id,
        status: schema_1.rideOccurrenceStudents.status,
        pickupTime: schema_1.rideOccurrenceStudents.pickupTime,
        excuseReason: schema_1.rideOccurrenceStudents.excuseReason,
        pickedUpAt: schema_1.rideOccurrenceStudents.pickedUpAt,
        droppedOffAt: schema_1.rideOccurrenceStudents.droppedOffAt,
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentAvatar: schema_1.students.avatar,
        studentGrade: schema_1.students.grade,
        studentClassroom: schema_1.students.classroom,
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        pickupPointAddress: schema_1.pickupPoints.address,
        pickupPointLat: schema_1.pickupPoints.lat,
        pickupPointLng: schema_1.pickupPoints.lng,
        stopOrder: schema_1.routePickupPoints.stopOrder,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
        .leftJoin(schema_1.routePickupPoints, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.rideOccurrenceStudents.pickupPointId), (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, occ.routeId)))
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, occId))
        .orderBy(schema_1.routePickupPoints.stopOrder);
    const formatStudent = (s) => ({
        id: s.id,
        status: s.status,
        pickupTime: s.pickupTime,
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
    const allStudents = occStudents.map(formatStudent);
    const pending = allStudents.filter((s) => s.status === "pending");
    const pickedUp = allStudents.filter((s) => s.status === "picked_up");
    const droppedOff = allStudents.filter((s) => s.status === "dropped_off");
    const absent = allStudents.filter((s) => s.status === "absent");
    const excused = allStudents.filter((s) => s.status === "excused");
    let duration = null;
    if (occ.startedAt && occ.completedAt) {
        const diffMs = new Date(occ.completedAt).getTime() - new Date(occ.startedAt).getTime();
        const diffMins = Math.round(diffMs / 60000);
        duration = {
            minutes: diffMins,
            formatted: `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`,
        };
    }
    let routeStops = [];
    if (occ.routeId) {
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
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, occ.routeId))
            .orderBy(schema_1.routePickupPoints.stopOrder);
        routeStops = routeStops.map((stop) => {
            const studentsAtStop = occStudents.filter((s) => s.pickupPointId === stop.id);
            return {
                ...stop,
                studentsCount: studentsAtStop.length,
                pendingCount: studentsAtStop.filter((s) => s.status === "pending").length,
                pickedUpCount: studentsAtStop.filter((s) => s.status === "picked_up" || s.status === "dropped_off").length,
                absentCount: studentsAtStop.filter((s) => s.status === "absent" || s.status === "excused").length,
            };
        });
    }
    res.json({
        success: true,
        data: {
            occurrence: {
                id: occId,
                date: occ.occurDate,
                status: occ.occurrenceStatus,
                startedAt: occ.startedAt,
                completedAt: occ.completedAt,
                duration,
                currentLocation: occ.currentLat && occ.currentLng
                    ? { lat: occ.currentLat, lng: occ.currentLng }
                    : null,
            },
            ride: {
                id: occ.rideId,
                name: occ.rideName,
                type: occ.rideType,
                frequency: occ.frequency,
                repeatType: occ.repeatType,
            },
            bus: occ.busId
                ? { id: occ.busId, busNumber: occ.busNumber, plateNumber: occ.plateNumber, maxSeats: occ.busMaxSeats }
                : null,
            driver: occ.driverId
                ? { id: occ.driverId, name: occ.driverName, phone: occ.driverPhone, avatar: occ.driverAvatar }
                : null,
            codriver: occ.codriverId
                ? { id: occ.codriverId, name: occ.codriverName, phone: occ.codriverPhone }
                : null,
            route: occ.routeId
                ? { id: occ.routeId, name: occ.routeName, stops: routeStops }
                : null,
            stats: {
                total: allStudents.length,
                pending: pending.length,
                pickedUp: pickedUp.length,
                droppedOff: droppedOff.length,
                absent: absent.length,
                excused: excused.length,
                onBus: pickedUp.length,
            },
            students: {
                all: allStudents,
                pending,
                pickedUp,
                droppedOff,
                absent,
                excused,
            },
        },
    });
};
exports.getOccurrenceDetails = getOccurrenceDetails;
// ✅ Update Ride
const updateRide = async (req, res) => {
    const { id } = req.params;
    const { busId, driverId, codriverId, routeId, name, rideType, isActive, students: studentsData } = req.body;
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
    if (busId) {
        const bus = await db_1.db.select().from(schema_1.buses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, busId), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId))).limit(1);
        if (!bus[0])
            throw new NotFound_1.NotFound("Bus not found");
    }
    if (driverId) {
        const driver = await db_1.db.select().from(schema_1.drivers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, driverId), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId))).limit(1);
        if (!driver[0])
            throw new NotFound_1.NotFound("Driver not found");
    }
    if (codriverId) {
        const codriver = await db_1.db.select().from(schema_1.codrivers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.codrivers.id, codriverId), (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId))).limit(1);
        if (!codriver[0])
            throw new NotFound_1.NotFound("Codriver not found");
    }
    if (routeId) {
        const route = await db_1.db.select().from(schema_1.Rout)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.Rout.id, routeId), (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId))).limit(1);
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
        isActive: isActive ?? existingRide[0].isActive,
    }).where((0, drizzle_orm_1.eq)(schema_1.rides.id, id));
    let studentsUpdated = false;
    if (studentsData && Array.isArray(studentsData)) {
        await updateRideStudents(id, studentsData, organizationId);
        studentsUpdated = true;
    }
    (0, response_1.SuccessResponse)(res, {
        message: "Ride updated successfully",
        studentsUpdated,
    }, 200);
};
exports.updateRide = updateRide;
// ✅ دالة تحديث الطلاب
async function updateRideStudents(rideId, studentsData, organizationId) {
    const currentStudents = await db_1.db
        .select()
        .from(schema_1.rideStudents)
        .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId));
    const currentStudentIds = currentStudents.map(s => s.studentId);
    const newStudentIds = studentsData.map(s => s.studentId);
    const toAdd = studentsData.filter(s => !currentStudentIds.includes(s.studentId));
    const toRemove = currentStudents.filter(s => !newStudentIds.includes(s.studentId));
    const toUpdate = studentsData.filter(s => currentStudentIds.includes(s.studentId));
    const futureOccurrences = await db_1.db
        .select({ id: schema_1.rideOccurrences.id })
        .from(schema_1.rideOccurrences)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, rideId), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, new Date()), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "scheduled")));
    const futureOccIds = futureOccurrences.map(o => o.id);
    if (toRemove.length > 0) {
        const removeIds = toRemove.map(s => s.studentId);
        await db_1.db.delete(schema_1.rideStudents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId), (0, drizzle_orm_1.inArray)(schema_1.rideStudents.studentId, removeIds)));
        if (futureOccIds.length > 0) {
            await db_1.db.delete(schema_1.rideOccurrenceStudents)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.occurrenceId, futureOccIds), (0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.studentId, removeIds)));
        }
    }
    if (toAdd.length > 0) {
        const rideStudentsToAdd = toAdd.map(s => ({
            rideId,
            studentId: s.studentId,
            pickupPointId: s.pickupPointId,
            pickupTime: s.pickupTime || null,
        }));
        await db_1.db.insert(schema_1.rideStudents).values(rideStudentsToAdd);
        if (futureOccIds.length > 0) {
            const occStudentsToAdd = [];
            for (const occId of futureOccIds) {
                for (const student of toAdd) {
                    occStudentsToAdd.push({
                        occurrenceId: occId,
                        studentId: student.studentId,
                        pickupPointId: student.pickupPointId,
                        pickupTime: student.pickupTime || null,
                        status: "pending",
                    });
                }
            }
            await db_1.db.insert(schema_1.rideOccurrenceStudents).values(occStudentsToAdd);
        }
    }
    for (const student of toUpdate) {
        await db_1.db.update(schema_1.rideStudents).set({
            pickupPointId: student.pickupPointId,
            pickupTime: student.pickupTime || null,
        }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, rideId), (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, student.studentId)));
        if (futureOccIds.length > 0) {
            await db_1.db.update(schema_1.rideOccurrenceStudents).set({
                pickupPointId: student.pickupPointId,
                pickupTime: student.pickupTime || null,
            }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.rideOccurrenceStudents.occurrenceId, futureOccIds), (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, student.studentId)));
        }
    }
}
// ✅ Delete Ride
const deleteRide = async (req, res) => {
    const { id } = req.params;
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
    await db_1.db.delete(schema_1.rideStudents).where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, id));
    await db_1.db.delete(schema_1.rides).where((0, drizzle_orm_1.eq)(schema_1.rides.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Ride deleted successfully" }, 200);
};
exports.deleteRide = deleteRide;
// ✅ Update Occurrence Status
const updateOccurrenceStatus = async (req, res) => {
    const { occurrenceId } = req.params;
    const { status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!occurrenceId) {
        throw new BadRequest_1.BadRequest("Occurrence ID is required");
    }
    if (!status || !["scheduled", "cancelled"].includes(status)) {
        throw new BadRequest_1.BadRequest("Invalid status. Use 'scheduled' or 'cancelled'");
    }
    const occurrence = await db_1.db
        .select({
        occId: schema_1.rideOccurrences.id,
        status: schema_1.rideOccurrences.status,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId), (0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId)))
        .limit(1);
    if (!occurrence[0]) {
        throw new NotFound_1.NotFound("Occurrence not found");
    }
    if (occurrence[0].status === "in_progress" || occurrence[0].status === "completed") {
        throw new BadRequest_1.BadRequest("Cannot change status of in-progress or completed occurrence");
    }
    await db_1.db
        .update(schema_1.rideOccurrences)
        .set({ status, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.id, occurrenceId));
    res.json({
        success: true,
        message: "Occurrence status updated successfully",
    });
};
exports.updateOccurrenceStatus = updateOccurrenceStatus;
// ✅ Selection Data
const selection = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // ✅ فلترة الـ routes الـ active بس
    const allRoutes = await db_1.db
        .select()
        .from(schema_1.Rout);
    const routesWithPickupPoints = await Promise.all(allRoutes.map(async (route) => {
        const points = await db_1.db
            .select({
            id: schema_1.routePickupPoints.id,
            stopOrder: schema_1.routePickupPoints.stopOrder,
            pickupPointId: schema_1.pickupPoints.id,
            pickupPointName: schema_1.pickupPoints.name,
            pickupPointAddress: schema_1.pickupPoints.address,
            pickupPointLat: schema_1.pickupPoints.lat,
            pickupPointLng: schema_1.pickupPoints.lng,
        })
            .from(schema_1.routePickupPoints)
            .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.pickupPoints.id))
            .where((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, route.id))
            .orderBy(schema_1.routePickupPoints.stopOrder);
        const formattedPoints = points.map((p) => ({
            id: p.id,
            stopOrder: p.stopOrder,
            pickupPoint: {
                id: p.pickupPointId,
                name: p.pickupPointName,
                address: p.pickupPointAddress,
                lat: p.pickupPointLat,
                lng: p.pickupPointLng,
            },
        }));
        return { ...route, pickupPoints: formattedPoints };
    }));
    // ✅ فلترة الـ buses الـ active بس
    const allBuses = await db_1.db
        .select()
        .from(schema_1.buses);
    // ✅ فلترة الـ drivers الـ active بس
    const allDrivers = await db_1.db
        .select()
        .from(schema_1.drivers);
    // ✅ فلترة الـ codrivers الـ active بس
    const allCodrivers = await db_1.db
        .select()
        .from(schema_1.codrivers);
    // ✅ فلترة الـ students الـ active بس
    const studentsData = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.students.status, "active")));
    const allStudents = studentsData.map((s) => ({
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        grade: s.grade,
        classroom: s.classroom,
        parent: {
            id: s.parentId,
            name: s.parentName,
            phone: s.parentPhone,
        },
    }));
    (0, response_1.SuccessResponse)(res, {
        routes: routesWithPickupPoints,
        buses: allBuses,
        drivers: allDrivers,
        codrivers: allCodrivers,
        students: allStudents,
    }, 200);
};
exports.selection = selection;
// ✅ Search Students
// ✅ Search Students
const searchStudentsForRide = async (req, res) => {
    const { phone, name, parentName } = req.query;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!phone && !name && !parentName) {
        throw new BadRequest_1.BadRequest("Please provide search criteria");
    }
    let conditions = [
        (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId),
        (0, drizzle_orm_1.eq)(schema_1.students.status, "active"), // ✅ فلترة الـ active بس
    ];
    if (phone) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.parents.phone} LIKE ${`%${phone}%`}`);
    }
    if (name) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.students.name} LIKE ${`%${name}%`}`);
    }
    if (parentName) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.parents.name} LIKE ${`%${parentName}%`}`);
    }
    const results = await db_1.db
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
        },
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.and)(...conditions))
        .limit(20);
    (0, response_1.SuccessResponse)(res, { students: results, count: results.length }, 200);
};
exports.searchStudentsForRide = searchStudentsForRide;
// ✅ Get Current Live Rides (للمتابعة اللحظية)
const getCurrentRides = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const today = new Date().toISOString().split("T")[0];
    // جلب الرحلات الجارية
    const liveRides = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        occurDate: schema_1.rideOccurrences.occurDate,
        status: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        completedAt: schema_1.rideOccurrences.completedAt,
        currentLat: schema_1.rideOccurrences.currentLat,
        currentLng: schema_1.rideOccurrences.currentLng,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        frequency: schema_1.rides.frequency,
        repeatType: schema_1.rides.repeatType,
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        busMaxSeats: schema_1.buses.maxSeats,
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
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "in_progress"), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${today}`))
        .orderBy(schema_1.rideOccurrences.startedAt);
    // جلب كل التفاصيل لكل رحلة
    const result = await Promise.all(liveRides.map(async (ride) => {
        // ✅ جلب الطلاب مع تفاصيلهم الكاملة
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
            studentGrade: schema_1.students.grade,
            studentClassroom: schema_1.students.classroom,
            parentId: schema_1.parents.id,
            parentName: schema_1.parents.name,
            parentPhone: schema_1.parents.phone,
            pickupPointId: schema_1.pickupPoints.id,
            pickupPointName: schema_1.pickupPoints.name,
            pickupPointAddress: schema_1.pickupPoints.address,
            pickupPointLat: schema_1.pickupPoints.lat,
            pickupPointLng: schema_1.pickupPoints.lng,
            stopOrder: schema_1.routePickupPoints.stopOrder,
        })
            .from(schema_1.rideOccurrenceStudents)
            .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
            .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
            .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.pickupPointId, schema_1.pickupPoints.id))
            .leftJoin(schema_1.routePickupPoints, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routePickupPoints.pickupPointId, schema_1.rideOccurrenceStudents.pickupPointId), ride.routeId ? (0, drizzle_orm_1.eq)(schema_1.routePickupPoints.routeId, ride.routeId) : (0, drizzle_orm_1.sql) `1=1`))
            .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, ride.occurrenceId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.routePickupPoints.stopOrder));
        // ✅ جلب نقاط التوقف (Route Stops)
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
                .orderBy((0, drizzle_orm_1.asc)(schema_1.routePickupPoints.stopOrder));
            // إضافة الطلاب لكل نقطة توقف
            routeStops = routeStops.map((stop) => {
                const studentsAtStop = occStudents.filter((s) => s.pickupPointId === stop.id);
                return {
                    ...stop,
                    studentsCount: studentsAtStop.length,
                    students: studentsAtStop.map((s) => ({
                        id: s.id,
                        status: s.status,
                        pickedUpAt: s.pickedUpAt,
                        droppedOffAt: s.droppedOffAt,
                        student: {
                            id: s.studentId,
                            name: s.studentName,
                            avatar: s.studentAvatar,
                        },
                        parent: {
                            id: s.parentId,
                            name: s.parentName,
                            phone: s.parentPhone,
                        },
                    })),
                    stats: {
                        total: studentsAtStop.length,
                        pending: studentsAtStop.filter((s) => s.status === "pending").length,
                        pickedUp: studentsAtStop.filter((s) => s.status === "picked_up").length,
                        droppedOff: studentsAtStop.filter((s) => s.status === "dropped_off").length,
                        absent: studentsAtStop.filter((s) => s.status === "absent" || s.status === "excused").length,
                    },
                };
            });
        }
        // ✅ إحصائيات الطلاب
        const stats = {
            total: occStudents.length,
            pending: occStudents.filter((s) => s.status === "pending").length,
            pickedUp: occStudents.filter((s) => s.status === "picked_up").length,
            droppedOff: occStudents.filter((s) => s.status === "dropped_off").length,
            absent: occStudents.filter((s) => s.status === "absent").length,
            excused: occStudents.filter((s) => s.status === "excused").length,
        };
        // ✅ حساب مدة الرحلة
        let duration = null;
        if (ride.startedAt) {
            const diffMs = Date.now() - new Date(ride.startedAt).getTime();
            const diffMins = Math.round(diffMs / 60000);
            duration = {
                minutes: diffMins,
                formatted: `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`,
            };
        }
        // ✅ حساب التقدم
        const completedCount = stats.pickedUp + stats.droppedOff + stats.absent + stats.excused;
        const progress = stats.total > 0 ? Math.round((completedCount / stats.total) * 100) : 0;
        // ✅ تحديد النقطة الحالية والقادمة
        let currentStop = null;
        let nextStop = null;
        if (routeStops.length > 0) {
            // النقطة الحالية: أول نقطة فيها طلاب pending
            currentStop = routeStops.find((stop) => stop.stats.pending > 0) || null;
            // النقطة القادمة: النقطة اللي بعد الحالية
            if (currentStop) {
                const currentStopId = currentStop.id;
                const currentIndex = routeStops.findIndex((s) => s.id === currentStopId);
                nextStop = routeStops[currentIndex + 1] || null;
            }
        }
        return {
            occurrence: {
                id: ride.occurrenceId,
                date: ride.occurDate,
                status: ride.status,
                startedAt: ride.startedAt,
                duration,
                currentLocation: ride.currentLat && ride.currentLng
                    ? { lat: Number(ride.currentLat), lng: Number(ride.currentLng) }
                    : null,
            },
            ride: {
                id: ride.rideId,
                name: ride.rideName,
                type: ride.rideType,
                frequency: ride.frequency,
                repeatType: ride.repeatType,
            },
            bus: ride.busId
                ? {
                    id: ride.busId,
                    busNumber: ride.busNumber,
                    plateNumber: ride.plateNumber,
                    maxSeats: ride.busMaxSeats,
                    occupancy: {
                        current: stats.pickedUp,
                        max: ride.busMaxSeats,
                        percentage: ride.busMaxSeats ? Math.round((stats.pickedUp / ride.busMaxSeats) * 100) : 0,
                    },
                }
                : null,
            driver: ride.driverId
                ? {
                    id: ride.driverId,
                    name: ride.driverName,
                    phone: ride.driverPhone,
                    avatar: ride.driverAvatar,
                }
                : null,
            codriver: ride.codriverId
                ? {
                    id: ride.codriverId,
                    name: ride.codriverName,
                    phone: ride.codriverPhone,
                }
                : null,
            route: ride.routeId
                ? {
                    id: ride.routeId,
                    name: ride.routeName,
                    totalStops: routeStops.length,
                    completedStops: routeStops.filter((s) => s.stats.pending === 0).length,
                    currentStop: currentStop
                        ? { id: currentStop.id, name: currentStop.name, order: currentStop.stopOrder }
                        : null,
                    nextStop: nextStop
                        ? { id: nextStop.id, name: nextStop.name, order: nextStop.stopOrder }
                        : null,
                    stops: routeStops,
                }
                : null,
            students: {
                stats: {
                    ...stats,
                    onBus: stats.pickedUp,
                    completed: completedCount,
                },
                progress,
                list: {
                    all: occStudents.map((s) => ({
                        id: s.id,
                        status: s.status,
                        pickupTime: s.pickupTime,
                        pickedUpAt: s.pickedUpAt,
                        droppedOffAt: s.droppedOffAt,
                        excuseReason: s.excuseReason,
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
                    })),
                    pending: occStudents.filter((s) => s.status === "pending").map((s) => ({
                        id: s.id,
                        student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
                        pickupPoint: { id: s.pickupPointId, name: s.pickupPointName },
                    })),
                    onBus: occStudents.filter((s) => s.status === "picked_up").map((s) => ({
                        id: s.id,
                        pickedUpAt: s.pickedUpAt,
                        student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
                    })),
                    droppedOff: occStudents.filter((s) => s.status === "dropped_off").map((s) => ({
                        id: s.id,
                        droppedOffAt: s.droppedOffAt,
                        student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
                    })),
                    absent: occStudents.filter((s) => s.status === "absent" || s.status === "excused").map((s) => ({
                        id: s.id,
                        status: s.status,
                        excuseReason: s.excuseReason,
                        student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
                    })),
                },
            },
        };
    }));
    // تصنيف حسب النوع
    const morning = result.filter((r) => r.ride.type === "morning");
    const afternoon = result.filter((r) => r.ride.type === "afternoon");
    // إحصائيات إجمالية
    const totalStudents = result.reduce((sum, r) => sum + r.students.stats.total, 0);
    const totalPickedUp = result.reduce((sum, r) => sum + r.students.stats.pickedUp, 0);
    const totalOnBus = result.reduce((sum, r) => sum + r.students.stats.onBus, 0);
    (0, response_1.SuccessResponse)(res, {
        date: today,
        rides: result,
        byType: { morning, afternoon },
        summary: {
            rides: {
                total: result.length,
                morning: morning.length,
                afternoon: afternoon.length,
            },
            students: {
                total: totalStudents,
                pickedUp: totalPickedUp,
                onBus: totalOnBus,
                overallProgress: totalStudents > 0
                    ? Math.round((totalPickedUp / totalStudents) * 100)
                    : 0,
            },
        },
    }, 200);
};
exports.getCurrentRides = getCurrentRides;
// ✅ Get Rides Dashboard Stats
const getRidesDashboard = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const today = new Date().toISOString().split("T")[0];
    // إحصائيات اليوم
    const [todayStats] = await db_1.db
        .select({
        total: (0, drizzle_orm_1.sql) `COUNT(*)`,
        scheduled: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrences.status} = 'scheduled' THEN 1 ELSE 0 END)`,
        inProgress: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrences.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        completed: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrences.status} = 'completed' THEN 1 ELSE 0 END)`,
        cancelled: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrences.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${today}`));
    // إحصائيات الطلاب اليوم
    const [studentsStats] = await db_1.db
        .select({
        total: (0, drizzle_orm_1.sql) `COUNT(*)`,
        pending: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
        pickedUp: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
        droppedOff: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
        absent: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
        excused: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.rideOccurrenceStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${today}`));
    // إجمالي الرحلات النشطة
    const [totalRides] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.rides)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.isActive, "on")));
    // الباصات والسائقين النشطين
    const [activeBuses] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.buses.status, "active")));
    const [activeDrivers] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.drivers.status, "active")));
    (0, response_1.SuccessResponse)(res, {
        date: today,
        today: {
            rides: {
                total: Number(todayStats?.total) || 0,
                scheduled: Number(todayStats?.scheduled) || 0,
                inProgress: Number(todayStats?.inProgress) || 0,
                completed: Number(todayStats?.completed) || 0,
                cancelled: Number(todayStats?.cancelled) || 0,
            },
            students: {
                total: Number(studentsStats?.total) || 0,
                pending: Number(studentsStats?.pending) || 0,
                pickedUp: Number(studentsStats?.pickedUp) || 0,
                droppedOff: Number(studentsStats?.droppedOff) || 0,
                absent: Number(studentsStats?.absent) || 0,
                excused: Number(studentsStats?.excused) || 0,
            },
        },
        resources: {
            totalRides: totalRides?.count || 0,
            activeBuses: activeBuses?.count || 0,
            activeDrivers: activeDrivers?.count || 0,
        },
    }, 200);
};
exports.getRidesDashboard = getRidesDashboard;
