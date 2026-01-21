"use strict";
// src/controllers/admin/busController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusDetails = exports.getBusTypes = exports.getBusStatistics = exports.getBusesByStatus = exports.updateBusStatus = exports.deleteBus = exports.updateBus = exports.createBus = exports.getBusById = exports.getAllBuses = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const helperfunction_1 = require("../../utils/helperfunction");
const uuid_1 = require("uuid");
const getAllBuses = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allBuses = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        maxSeats: schema_1.buses.maxSeats,
        licenseNumber: schema_1.buses.licenseNumber,
        licenseExpiryDate: schema_1.buses.licenseExpiryDate,
        licenseImage: schema_1.buses.licenseImage,
        busImage: schema_1.buses.busImage,
        status: schema_1.buses.status,
        createdAt: schema_1.buses.createdAt,
        updatedAt: schema_1.buses.updatedAt,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId));
    // إضافة معلومات الاستخدام
    const subscription = await (0, helperfunction_1.getActiveSubscription)(organizationId);
    const usageInfo = subscription
        ? {
            current: allBuses.length,
            max: subscription.plan.maxBuses,
            remaining: subscription.plan.maxBuses
                ? subscription.plan.maxBuses - allBuses.length
                : "unlimited",
        }
        : null;
    (0, response_1.SuccessResponse)(res, { buses: allBuses, usage: usageInfo }, 200);
};
exports.getAllBuses = getAllBuses;
// ✅ Get Bus By ID
const getBusById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const bus = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        maxSeats: schema_1.buses.maxSeats,
        licenseNumber: schema_1.buses.licenseNumber,
        licenseExpiryDate: schema_1.buses.licenseExpiryDate,
        licenseImage: schema_1.buses.licenseImage,
        busImage: schema_1.buses.busImage,
        status: schema_1.buses.status,
        createdAt: schema_1.buses.createdAt,
        updatedAt: schema_1.buses.updatedAt,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
            description: schema_1.busTypes.description,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!bus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    (0, response_1.SuccessResponse)(res, { bus: bus[0] }, 200);
};
exports.getBusById = getBusById;
// ✅ Create Bus
const createBus = async (req, res) => {
    const { busTypeId, plateNumber, busNumber, maxSeats, licenseNumber, licenseExpiryDate, licenseImage, busImage, } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // التحقق من الاشتراك وحد الباصات أولاً
    //await checkBusLimit(organizationId);
    // تحقق من وجود الـ Bus Type
    const busType = await db_1.db
        .select()
        .from(schema_1.busTypes)
        .where((0, drizzle_orm_1.eq)(schema_1.busTypes.id, busTypeId))
        .limit(1);
    if (!busType[0]) {
        throw new NotFound_1.NotFound("Bus Type not found");
    }
    // تحقق من عدم تكرار رقم اللوحة
    const existingPlate = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.eq)(schema_1.buses.plateNumber, plateNumber))
        .limit(1);
    if (existingPlate[0]) {
        throw new BadRequest_1.BadRequest("Plate Number already exists");
    }
    // تحقق من عدم تكرار رقم الباص في نفس المنظمة
    const existingBusNumber = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.busNumber, busNumber), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (existingBusNumber[0]) {
        throw new BadRequest_1.BadRequest("Bus Number already exists");
    }
    // حفظ الصور
    let savedLicenseImage = null;
    let savedBusImage = null;
    if (licenseImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, licenseImage, "buses/licenses");
        savedLicenseImage = result.url;
    }
    if (busImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, busImage, "buses/photos");
        savedBusImage = result.url;
    }
    // توليد ID
    const newBusId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.buses).values({
        id: newBusId,
        organizationId,
        busTypeId,
        plateNumber,
        busNumber,
        maxSeats,
        licenseNumber: licenseNumber || null,
        licenseExpiryDate: licenseExpiryDate || null,
        licenseImage: savedLicenseImage,
        busImage: savedBusImage,
    });
    // جلب الباص الجديد
    const [createdBus] = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        maxSeats: schema_1.buses.maxSeats,
        licenseNumber: schema_1.buses.licenseNumber,
        licenseExpiryDate: schema_1.buses.licenseExpiryDate,
        licenseImage: schema_1.buses.licenseImage,
        busImage: schema_1.buses.busImage,
        status: schema_1.buses.status,
        createdAt: schema_1.buses.createdAt,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.eq)(schema_1.buses.id, newBusId))
        .limit(1);
    (0, response_1.SuccessResponse)(res, { message: "Bus created successfully", bus: createdBus }, 201);
};
exports.createBus = createBus;
// ✅ Update Bus
const updateBus = async (req, res) => {
    const { id } = req.params;
    const { busTypeId, busNumber, plateNumber, maxSeats, licenseNumber, licenseExpiryDate, licenseImage, busImage, status, } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // تحقق من وجود الباص
    const existingBus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    const bus = existingBus[0];
    // لو بيغير الـ Bus Type، نتحقق إنه موجود
    if (busTypeId && busTypeId !== bus.busTypeId) {
        const busType = await db_1.db
            .select()
            .from(schema_1.busTypes)
            .where((0, drizzle_orm_1.eq)(schema_1.busTypes.id, busTypeId))
            .limit(1);
        if (!busType[0]) {
            throw new BadRequest_1.BadRequest("Bus Type not found");
        }
    }
    // لو بيغير رقم اللوحة، نتحقق إنه مش مكرر
    if (plateNumber && plateNumber !== bus.plateNumber) {
        const existingPlate = await db_1.db
            .select()
            .from(schema_1.buses)
            .where((0, drizzle_orm_1.eq)(schema_1.buses.plateNumber, plateNumber))
            .limit(1);
        if (existingPlate[0]) {
            throw new BadRequest_1.BadRequest("Plate Number already exists");
        }
    }
    // لو بيغير رقم الباص، نتحقق إنه مش مكرر في نفس الـ Organization
    if (busNumber && busNumber !== bus.busNumber) {
        const existingBusNumber = await db_1.db
            .select()
            .from(schema_1.buses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.busNumber, busNumber), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
            .limit(1);
        if (existingBusNumber[0]) {
            throw new BadRequest_1.BadRequest("Bus Number already exists in this organization");
        }
    }
    // Validate status if provided
    if (status && !["active", "inactive", "maintenance"].includes(status)) {
        throw new BadRequest_1.BadRequest("Invalid status. Must be: active, inactive, or maintenance");
    }
    // التعامل مع صورة الرخصة
    let savedLicenseImage = bus.licenseImage;
    if (licenseImage !== undefined) {
        if (licenseImage) {
            const result = await (0, handleImages_1.saveBase64Image)(req, licenseImage, "buses/licenses");
            // حذف الصورة القديمة بعد حفظ الجديدة بنجاح
            if (bus.licenseImage) {
                await (0, deleteImage_1.deletePhotoFromServer)(bus.licenseImage);
            }
            savedLicenseImage = result.url;
        }
        else {
            // حذف الصورة القديمة
            if (bus.licenseImage) {
                await (0, deleteImage_1.deletePhotoFromServer)(bus.licenseImage);
            }
            savedLicenseImage = null;
        }
    }
    // التعامل مع صورة الباص
    let savedBusImage = bus.busImage;
    if (busImage !== undefined) {
        if (busImage) {
            const result = await (0, handleImages_1.saveBase64Image)(req, busImage, "buses/photos");
            // حذف الصورة القديمة بعد حفظ الجديدة بنجاح
            if (bus.busImage) {
                await (0, deleteImage_1.deletePhotoFromServer)(bus.busImage);
            }
            savedBusImage = result.url;
        }
        else {
            // حذف الصورة القديمة
            if (bus.busImage) {
                await (0, deleteImage_1.deletePhotoFromServer)(bus.busImage);
            }
            savedBusImage = null;
        }
    }
    await db_1.db
        .update(schema_1.buses)
        .set({
        busTypeId: busTypeId ?? bus.busTypeId,
        busNumber: busNumber ?? bus.busNumber,
        plateNumber: plateNumber ?? bus.plateNumber,
        maxSeats: maxSeats ?? bus.maxSeats,
        licenseNumber: licenseNumber !== undefined ? licenseNumber : bus.licenseNumber,
        licenseExpiryDate: licenseExpiryDate !== undefined
            ? licenseExpiryDate
            : bus.licenseExpiryDate,
        licenseImage: savedLicenseImage,
        busImage: savedBusImage,
        status: status ?? bus.status,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.buses.id, id));
    // جلب الباص المحدث
    const [updatedBus] = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        maxSeats: schema_1.buses.maxSeats,
        licenseNumber: schema_1.buses.licenseNumber,
        licenseExpiryDate: schema_1.buses.licenseExpiryDate,
        licenseImage: schema_1.buses.licenseImage,
        busImage: schema_1.buses.busImage,
        status: schema_1.buses.status,
        updatedAt: schema_1.buses.updatedAt,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.eq)(schema_1.buses.id, id))
        .limit(1);
    (0, response_1.SuccessResponse)(res, { message: "Bus updated successfully", bus: updatedBus }, 200);
};
exports.updateBus = updateBus;
// ✅ Delete Bus
const deleteBus = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingBus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    // Check if bus has associated rides
    const associatedRides = await db_1.db.select().from(schema_1.rides).where((0, drizzle_orm_1.eq)(schema_1.rides.busId, id)).limit(1);
    if (associatedRides.length > 0) {
        throw new BadRequest_1.BadRequest("Cannot delete bus: there are rides associated with this bus. Please delete or reassign the rides first.");
    }
    // حذف الصور من السيرفر
    if (existingBus[0].licenseImage) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingBus[0].licenseImage);
    }
    if (existingBus[0].busImage) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingBus[0].busImage);
    }
    await db_1.db.delete(schema_1.buses).where((0, drizzle_orm_1.eq)(schema_1.buses.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Bus deleted successfully" }, 200);
};
exports.deleteBus = deleteBus;
// ✅ Update Bus Status
const updateBusStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!status) {
        throw new BadRequest_1.BadRequest("Status is required");
    }
    if (!["active", "inactive", "maintenance"].includes(status)) {
        throw new BadRequest_1.BadRequest("Invalid status. Must be: active, inactive, or maintenance");
    }
    const existingBus = await db_1.db
        .select()
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!existingBus[0]) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    await db_1.db.update(schema_1.buses).set({ status }).where((0, drizzle_orm_1.eq)(schema_1.buses.id, id));
    (0, response_1.SuccessResponse)(res, { message: `Bus status updated to ${status}` }, 200);
};
exports.updateBusStatus = updateBusStatus;
// ✅ Get Buses By Status
const getBusesByStatus = async (req, res) => {
    const { status } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!["active", "inactive", "maintenance"].includes(status)) {
        throw new BadRequest_1.BadRequest("Invalid status. Must be: active, inactive, or maintenance");
    }
    const filteredBuses = await db_1.db
        .select({
        id: schema_1.buses.id,
        busNumber: schema_1.buses.busNumber,
        plateNumber: schema_1.buses.plateNumber,
        maxSeats: schema_1.buses.maxSeats,
        licenseImage: schema_1.buses.licenseImage,
        busImage: schema_1.buses.busImage,
        status: schema_1.buses.status,
        busType: {
            id: schema_1.busTypes.id,
            name: schema_1.busTypes.name,
            capacity: schema_1.busTypes.capacity,
        },
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.buses.status, status)));
    (0, response_1.SuccessResponse)(res, {
        buses: filteredBuses,
        count: filteredBuses.length,
        status: status,
    }, 200);
};
exports.getBusesByStatus = getBusesByStatus;
// ✅ Get Bus Statistics (جديد)
const getBusStatistics = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // عدد الباصات حسب الحالة
    const allBuses = await db_1.db
        .select({ status: schema_1.buses.status })
        .from(schema_1.buses)
        .where((0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId));
    const stats = {
        total: allBuses.length,
        active: allBuses.filter((b) => b.status === "active").length,
        inactive: allBuses.filter((b) => b.status === "inactive").length,
        maintenance: allBuses.filter((b) => b.status === "maintenance").length,
    };
    // معلومات الاشتراك
    const subscription = await (0, helperfunction_1.getActiveSubscription)(organizationId);
    const subscriptionInfo = subscription
        ? {
            planName: subscription.plan.name,
            maxBuses: subscription.plan.maxBuses,
            used: stats.total,
            remaining: subscription.plan.maxBuses
                ? subscription.plan.maxBuses - stats.total
                : "unlimited",
            expiresAt: subscription.subscription.endDate,
        }
        : null;
    (0, response_1.SuccessResponse)(res, {
        statistics: stats,
        subscription: subscriptionInfo,
    }, 200);
};
exports.getBusStatistics = getBusStatistics;
const getBusTypes = async (req, res) => {
    const allBusTypes = await db_1.db.select().from(schema_1.busTypes);
    (0, response_1.SuccessResponse)(res, { busTypes: allBusTypes }, 200);
};
exports.getBusTypes = getBusTypes;
// ✅ 2) GET BUS FULL DETAILS
// ============================================
const getBusDetails = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new NotFound_1.NotFound("Organization not found");
    }
    // 1) بيانات الباص الأساسية مع Bus Type
    const [bus] = await db_1.db
        .select({
        id: schema_1.buses.id,
        plateNumber: schema_1.buses.plateNumber,
        busNumber: schema_1.buses.busNumber,
        maxSeats: schema_1.buses.maxSeats,
        licenseNumber: schema_1.buses.licenseNumber,
        licenseExpiryDate: schema_1.buses.licenseExpiryDate,
        licenseImage: schema_1.buses.licenseImage,
        busImage: schema_1.buses.busImage,
        status: schema_1.buses.status,
        createdAt: schema_1.buses.createdAt,
        updatedAt: schema_1.buses.updatedAt,
        // Bus Type
        busTypeId: schema_1.busTypes.id,
        busTypeName: schema_1.busTypes.name,
    })
        .from(schema_1.buses)
        .leftJoin(schema_1.busTypes, (0, drizzle_orm_1.eq)(schema_1.buses.busTypeId, schema_1.busTypes.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.buses.id, id), (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId)))
        .limit(1);
    if (!bus) {
        throw new NotFound_1.NotFound("Bus not found");
    }
    // 2) الرحلات المرتبطة بالباص مع السائق والمشرف
    const busRides = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        rideStatus: schema_1.rides.status,
        rideIsActive: schema_1.rides.isActive,
        startDate: schema_1.rides.startDate,
        endDate: schema_1.rides.endDate,
        frequency: schema_1.rides.frequency,
        // Driver
        driverId: schema_1.drivers.id,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
        driverAvatar: schema_1.drivers.avatar,
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
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .leftJoin(schema_1.codrivers, (0, drizzle_orm_1.eq)(schema_1.rides.codriverId, schema_1.codrivers.id))
        .leftJoin(schema_1.Rout, (0, drizzle_orm_1.eq)(schema_1.rides.routeId, schema_1.Rout.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.busId, id));
    // 3) الطلاب في هذا الباص
    const busStudents = await db_1.db
        .select({
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentCode: schema_1.students.code,
        studentAvatar: schema_1.students.avatar,
        studentGrade: schema_1.students.grade,
        studentClassroom: schema_1.students.classroom,
        studentStatus: schema_1.students.status,
        pickupTime: schema_1.rideStudents.pickupTime,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        // Pickup Point
        pickupPointId: schema_1.pickupPoints.id,
        pickupPointName: schema_1.pickupPoints.name,
        // Parent
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
    })
        .from(schema_1.rideStudents)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, schema_1.rides.id))
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rides.busId, id));
    // 4) الرحلات القادمة (7 أيام)
    const today = new Date(new Date().toISOString().split('T')[0]);
    const nextWeek = new Date(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    const upcomingOccurrences = await db_1.db
        .select({
        occurrenceId: schema_1.rideOccurrences.id,
        date: schema_1.rideOccurrences.occurDate,
        status: schema_1.rideOccurrences.status,
        startedAt: schema_1.rideOccurrences.startedAt,
        rideId: schema_1.rides.id,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
        driverName: schema_1.drivers.name,
        driverPhone: schema_1.drivers.phone,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.busId, id), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, today), (0, drizzle_orm_1.lte)(schema_1.rideOccurrences.occurDate, nextWeek)))
        .orderBy(schema_1.rideOccurrences.occurDate)
        .limit(20);
    // 5) سجل الرحلات (آخر 30 يوم)
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
        driverName: schema_1.drivers.name,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .leftJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.rides.driverId, schema_1.drivers.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.busId, id), (0, drizzle_orm_1.gte)(schema_1.rideOccurrences.occurDate, new Date(thirtyDaysAgo.toISOString().split('T')[0]))))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.rideOccurrences.occurDate))
        .limit(50);
    // 6) إحصائيات
    const uniqueStudents = [...new Set(busStudents.map(s => s.studentId))];
    const stats = {
        totalRides: busRides.length,
        activeRides: busRides.filter(r => r.rideIsActive === 'on').length,
        totalStudents: uniqueStudents.length,
        maxSeats: bus.maxSeats,
        availableSeats: bus.maxSeats - uniqueStudents.length,
        capacityPercentage: Math.round((uniqueStudents.length / bus.maxSeats) * 100),
        completedTripsThisMonth: rideHistory.filter(r => r.status === 'completed').length,
        inProgressTrips: rideHistory.filter(r => r.status === 'in_progress').length,
        cancelledTrips: rideHistory.filter(r => r.status === 'cancelled').length,
        // حالة الرخصة
        licenseStatus: bus.licenseExpiryDate
            ? new Date(bus.licenseExpiryDate) > new Date()
                ? 'valid'
                : 'expired'
            : 'unknown',
        daysUntilLicenseExpiry: bus.licenseExpiryDate
            ? Math.ceil((new Date(bus.licenseExpiryDate).getTime() - Date.now()) / 86400000)
            : null,
    };
    (0, response_1.SuccessResponse)(res, {
        bus: {
            id: bus.id,
            plateNumber: bus.plateNumber,
            busNumber: bus.busNumber,
            maxSeats: bus.maxSeats,
            licenseNumber: bus.licenseNumber,
            licenseExpiryDate: bus.licenseExpiryDate,
            licenseImage: bus.licenseImage,
            busImage: bus.busImage,
            status: bus.status,
            createdAt: bus.createdAt,
            updatedAt: bus.updatedAt,
            busType: bus.busTypeId ? {
                id: bus.busTypeId,
                name: bus.busTypeName,
                maxSeats: bus.maxSeats,
            } : null,
        },
        rides: busRides.map(r => ({
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
            driver: r.driverId ? {
                id: r.driverId,
                name: r.driverName,
                phone: r.driverPhone,
                avatar: r.driverAvatar,
            } : null,
            codriver: r.codriverId ? {
                id: r.codriverId,
                name: r.codriverName,
                phone: r.codriverPhone,
                avatar: r.codriverAvatar,
            } : null,
        })),
        students: busStudents.map(s => ({
            id: s.studentId,
            name: s.studentName,
            code: s.studentCode,
            avatar: s.studentAvatar,
            grade: s.studentGrade,
            classroom: s.studentClassroom,
            status: s.studentStatus,
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
            parent: s.parentId ? {
                id: s.parentId,
                name: s.parentName,
                phone: s.parentPhone,
            } : null,
        })),
        upcomingRides: upcomingOccurrences.map(r => ({
            occurrenceId: r.occurrenceId,
            date: r.date,
            status: r.status,
            startedAt: r.startedAt,
            ride: {
                id: r.rideId,
                name: r.rideName,
                type: r.rideType,
            },
            driver: {
                name: r.driverName,
                phone: r.driverPhone,
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
            driver: r.driverName,
        })),
        stats,
    }, 200);
};
exports.getBusDetails = getBusDetails;
