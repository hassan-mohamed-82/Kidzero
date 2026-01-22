"use strict";
// src/controllers/admin/driverController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverDetails = exports.deleteDriver = exports.updateDriver = exports.getDriverById = exports.getAllDrivers = exports.createDriver = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
// ✅ Create Driver
const createDriver = async (req, res) => {
    const { name, phone, password, email, avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // Check subscription limit
    //   await checkDriverLimit(organizationId);
    // Check if phone already exists
    const existingDriver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.eq)(schema_1.drivers.phone, phone))
        .limit(1);
    if (existingDriver[0]) {
        throw new BadRequest_1.BadRequest("Phone number already registered");
    }
    const driverId = (0, uuid_1.v4)();
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    // Handle images
    let avatarUrl = null;
    let licenseImageUrl = null;
    let nationalIdImageUrl = null;
    if (avatar) {
        const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `drivers/${driverId}`);
        avatarUrl = result.url;
    }
    if (licenseImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, licenseImage, `drivers/${driverId}`);
        licenseImageUrl = result.url;
    }
    if (nationalIdImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, nationalIdImage, `drivers/${driverId}`);
        nationalIdImageUrl = result.url;
    }
    await db_1.db.insert(schema_1.drivers).values({
        id: driverId,
        organizationId,
        email,
        name,
        phone,
        password: hashedPassword,
        avatar: avatarUrl,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        licenseImage: licenseImageUrl,
        nationalId: nationalId || null,
        nationalIdImage: nationalIdImageUrl,
    });
    (0, response_1.SuccessResponse)(res, { message: "Driver created successfully", driverId }, 201);
};
exports.createDriver = createDriver;
// ✅ Get All Drivers
const getAllDrivers = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allDrivers = await db_1.db
        .select({
        id: schema_1.drivers.id,
        name: schema_1.drivers.name,
        phone: schema_1.drivers.phone,
        avatar: schema_1.drivers.avatar,
        licenseExpiry: schema_1.drivers.licenseExpiry,
        email: schema_1.drivers.email,
        licenseImage: schema_1.drivers.licenseImage,
        nationalId: schema_1.drivers.nationalId,
        nationalIdImage: schema_1.drivers.nationalIdImage,
        status: schema_1.drivers.status,
        createdAt: schema_1.drivers.createdAt,
        updatedAt: schema_1.drivers.updatedAt,
    })
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { drivers: allDrivers }, 200);
};
exports.getAllDrivers = getAllDrivers;
// ✅ Get Driver By ID
const getDriverById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const driver = await db_1.db
        .select({
        id: schema_1.drivers.id,
        name: schema_1.drivers.name,
        phone: schema_1.drivers.phone,
        avatar: schema_1.drivers.avatar,
        licenseExpiry: schema_1.drivers.licenseExpiry,
        email: schema_1.drivers.email,
        licenseImage: schema_1.drivers.licenseImage,
        nationalId: schema_1.drivers.nationalId,
        nationalIdImage: schema_1.drivers.nationalIdImage,
        status: schema_1.drivers.status,
        createdAt: schema_1.drivers.createdAt,
        updatedAt: schema_1.drivers.updatedAt,
    })
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, id), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!driver[0]) {
        throw new NotFound_1.NotFound("Driver not found");
    }
    (0, response_1.SuccessResponse)(res, { driver: driver[0] }, 200);
};
exports.getDriverById = getDriverById;
// ✅ Update Driver
const updateDriver = async (req, res) => {
    const { id } = req.params;
    const { name, phone, password, email, avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingDriver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, id), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!existingDriver[0]) {
        throw new NotFound_1.NotFound("Driver not found");
    }
    // Check if phone is being changed and already exists
    if (phone && phone !== existingDriver[0].phone) {
        const phoneExists = await db_1.db
            .select()
            .from(schema_1.drivers)
            .where((0, drizzle_orm_1.eq)(schema_1.drivers.phone, phone))
            .limit(1);
        if (phoneExists[0]) {
            throw new BadRequest_1.BadRequest("Phone number already registered");
        }
    }
    // Handle password
    let hashedPassword = existingDriver[0].password;
    if (password) {
        hashedPassword = await bcrypt_1.default.hash(password, 10);
    }
    // Handle avatar
    let avatarUrl = existingDriver[0].avatar;
    if (avatar !== undefined) {
        if (existingDriver[0].avatar) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].avatar);
        }
        if (avatar) {
            const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `drivers/${id}`);
            avatarUrl = result.url;
        }
        else {
            avatarUrl = null;
        }
    }
    // Handle license image
    let licenseImageUrl = existingDriver[0].licenseImage;
    if (licenseImage !== undefined) {
        if (existingDriver[0].licenseImage) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].licenseImage);
        }
        if (licenseImage) {
            const result = await (0, handleImages_1.saveBase64Image)(req, licenseImage, `drivers/${id}`);
            licenseImageUrl = result.url;
        }
        else {
            licenseImageUrl = null;
        }
    }
    // Handle national ID image
    let nationalIdImageUrl = existingDriver[0].nationalIdImage;
    if (nationalIdImage !== undefined) {
        if (existingDriver[0].nationalIdImage) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].nationalIdImage);
        }
        if (nationalIdImage) {
            const result = await (0, handleImages_1.saveBase64Image)(req, nationalIdImage, `drivers/${id}`);
            nationalIdImageUrl = result.url;
        }
        else {
            nationalIdImageUrl = null;
        }
    }
    await db_1.db.update(schema_1.drivers).set({
        name: name ?? existingDriver[0].name,
        phone: phone ?? existingDriver[0].phone,
        password: hashedPassword,
        email: email ?? existingDriver[0].email,
        avatar: avatarUrl,
        licenseExpiry: licenseExpiry !== undefined
            ? (licenseExpiry ? new Date(licenseExpiry) : null)
            : existingDriver[0].licenseExpiry,
        licenseImage: licenseImageUrl,
        nationalId: nationalId !== undefined ? nationalId : existingDriver[0].nationalId,
        nationalIdImage: nationalIdImageUrl,
        status: status ?? existingDriver[0].status,
    }).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Driver updated successfully" }, 200);
};
exports.updateDriver = updateDriver;
// ✅ Delete Driver
// ✅ Delete Driver
const deleteDriver = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingDriver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, id), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!existingDriver[0]) {
        throw new NotFound_1.NotFound("Driver not found");
    }
    // ✅ تحقق إن الـ Driver مش مرتبط برحلات
    const driverRides = await db_1.db
        .select({ id: schema_1.rides.id })
        .from(schema_1.rides)
        .where((0, drizzle_orm_1.eq)(schema_1.rides.driverId, id))
        .limit(1);
    if (driverRides.length > 0) {
        throw new BadRequest_1.BadRequest("Cannot delete driver. Driver is assigned to rides. Please reassign or delete the rides first.");
    }
    try {
        // Delete images
        if (existingDriver[0].avatar) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].avatar);
        }
        if (existingDriver[0].licenseImage) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].licenseImage);
        }
        if (existingDriver[0].nationalIdImage) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].nationalIdImage);
        }
        await db_1.db.delete(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id));
        (0, response_1.SuccessResponse)(res, { message: "Driver deleted successfully" }, 200);
    }
    catch (error) {
        console.error("Delete Driver Error:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new BadRequest_1.BadRequest("Cannot delete driver. Driver is linked to other records.");
        }
        throw error;
    }
};
exports.deleteDriver = deleteDriver;
// ============================================
// ✅ 3) GET DRIVER FULL DETAILS
// ============================================
const getDriverDetails = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new NotFound_1.NotFound("Organization not found");
    }
    // 1) بيانات السائق الأساسية
    const [driver] = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, id), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!driver) {
        throw new NotFound_1.NotFound("Driver not found");
    }
    // 2) الرحلات المرتبطة بالسائق مع الباص والمشرف
    const driverRides = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        rideStatus: schema_1.rides.status,
        rideIsActive: schema_1.rides.isActive,
        startDate: schema_1.rides.startDate,
        endDate: schema_1.rides.endDate,
        frequency: schema_1.rides.frequency,
        // Bus
        busId: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        busPlateNumber: schema_1.buses.plateNumber,
        busImage: schema_1.buses.busImage,
        busMaxSeats: schema_1.buses.maxSeats,
        // Codriver
        codriverId: schema_1.codrivers.id,
        codriverName: schema_1.codrivers.name,
        codriverPhone: schema_1.codrivers.phone,
        codriverAvatar: schema_1.codrivers.avatar,
        // Route
        routeId: schema_1.Rout.id,
        routeName: schema_1.Rout.name,
    })
        .from(schema_1.rides)
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.driverId, id));
    // 3) الطلاب في رحلاته
    const driverStudents = await db_1.db
        .select({
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentCode: schema_1.students.code,
        studentAvatar: schema_1.students.avatar,
        studentGrade: schema_1.students.grade,
        studentClassroom: schema_1.students.classroom,
        pickupTime: schema_1.rideStudents.pickupTime,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        // Pickup Point
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        // Parent
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
    })
        .from(schema_1.rideStudents)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, schema_1.rides.id))
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.driverId, id));
    // 4) سجل الرحلات (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const rideHistory = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        date: schema_1.rideOccurrences.occurDate,
        status: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        completedAt: schema_1.rideOccurrences.completedAt,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        busNumber: schema_1.buses.busNumber,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.driverId, id), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, new Date(thirtyDaysAgo.toISOString().split('T')[0]))))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.rideOccurrences.occurDate))
        .limit(50);
    // 5) الرحلات القادمة (7 أيام)
    const today = new Date(new Date().toISOString().split('T')[0]);
    const nextWeek = new Date(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    const upcomingRides = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        date: schema_1.rideOccurrences.occurDate,
        status: schema_1.rideOccurrences.status,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        busNumber: schema_1.buses.busNumber,
        busPlateNumber: schema_1.buses.plateNumber,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.buses, (0, drizzle_orm_1.eq)(schema_1.rides.busId, schema_1.buses.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.driverId, id), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, today), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, nextWeek)))
        .orderBy(schema_1.rideOccurrences.occurDate)
        .limit(20);
    // 6) إحصائيات
    const uniqueStudents = [...new Set(driverStudents.map(s => s.studentId))];
    const stats = {
        totalRides: driverRides.length,
        activeRides: driverRides.filter(r => r.rideIsActive === 'on').length,
        totalStudents: uniqueStudents.length,
        completedTripsThisMonth: rideHistory.filter(r => r.status === 'completed').length,
        inProgressTrips: rideHistory.filter(r => r.status === 'in_progress').length,
        cancelledTrips: rideHistory.filter(r => r.status === 'cancelled').length,
        totalTripsThisMonth: rideHistory.length,
        // حالة الرخصة
        licenseStatus: driver.licenseExpiry
            ? new Date(driver.licenseExpiry) > new Date()
                ? 'valid'
                : 'expired'
            : 'unknown',
        daysUntilLicenseExpiry: driver.licenseExpiry
            ? Math.ceil((new Date(driver.licenseExpiry).getTime() - Date.now()) / 86400000)
            : null,
    };
    (0, response_1.SuccessResponse)(res, {
        driver: {
            id: driver.id,
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            avatar: driver.avatar,
            nationalId: driver.nationalId,
            nationalIdImage: driver.nationalIdImage,
            licenseExpiry: driver.licenseExpiry,
            licenseImage: driver.licenseImage,
            status: driver.status,
            createdAt: driver.createdAt,
            updatedAt: driver.updatedAt,
        },
        rides: driverRides.map(r => ({
            id: r.rideId,
            name: r.rideName,
            type: r.rideType,
            status: r.rideStatus,
            isActive: r.rideIsActive,
            frequency: r.frequency,
            startDate: r.startDate,
            endDate: r.endDate,
            route: r.routeId ? {
                id: r.routeId,
                name: r.routeName,
            } : null,
            bus: r.busId ? {
                id: r.busId,
                number: r.busNumber,
                plateNumber: r.busPlateNumber,
                image: r.busImage,
                maxSeats: r.busMaxSeats,
            } : null,
            codriver: r.codriverId ? {
                id: r.codriverId,
                name: r.codriverName,
                phone: r.codriverPhone,
                avatar: r.codriverAvatar,
            } : null,
        })),
        students: driverStudents.map(s => ({
            id: s.studentId,
            name: s.studentName,
            code: s.studentCode,
            avatar: s.studentAvatar,
            grade: s.studentGrade,
            classroom: s.studentClassroom,
            pickupTime: s.pickupTime,
            pickupPoint: s.pickupPointId ? {
                id: s.pickupPointId,
                name: s.pickupPointName,
            } : null,
            ride: {
                id: s.rideId,
                name: s.rideName,
                type: s.rideType,
            },
            parent: {
                name: s.parentName,
                phone: s.parentPhone,
            },
        })),
        upcomingRides: upcomingRides.map(r => ({
            occurrenceId: r.occurrenceId,
            date: r.date,
            status: r.status,
            ride: {
                id: r.rideId,
                name: r.rideName,
                type: r.rideType,
            },
            bus: {
                number: r.busNumber,
                plateNumber: r.busPlateNumber,
            },
        })),
        rideHistory: rideHistory.map(r => ({
            id: r.occurrenceId,
            date: r.date,
            status: r.status,
            startedAt: r.startedAt,
            completedAt: r.completedAt,
            ride: {
                name: r.rideName,
                type: r.rideType,
            },
            bus: r.busNumber,
        })),
        stats,
    }, 200);
};
exports.getDriverDetails = getDriverDetails;
