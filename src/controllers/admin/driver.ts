// src/controllers/admin/driverController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { buses, codrivers, drivers, organizations, parents, pickupPoints, rideOccurrences, rides, rideStudents, Rout, students } from "../../models/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { checkDriverLimit } from "../../utils/helperfunction";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Driver
export const createDriver = async (req: Request, res: Response) => {
    const { name, phone, password, email, avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const organization = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    if (!organization || !organization[0]) {
        throw new BadRequest("Invalid Organization");
    }
    // Check subscription limit


      await checkDriverLimit(organizationId);

    // Check if phone already exists
    const existingDriver = await db
        .select()
        .from(drivers)
        .where(eq(drivers.phone, phone))
        .limit(1);

    if (existingDriver[0]) {
        throw new BadRequest("Phone number already registered");
    }

    const driverId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle images
    let avatarUrl = null;
    let licenseImageUrl = null;
    let nationalIdImageUrl = null;

    if (avatar) {
        const result = await saveBase64Image(req, avatar, `drivers/${driverId}`);
        avatarUrl = result.url;
    }

    if (licenseImage) {
        const result = await saveBase64Image(req, licenseImage, `drivers/${driverId}`);
        licenseImageUrl = result.url;
    }

    if (nationalIdImage) {
        const result = await saveBase64Image(req, nationalIdImage, `drivers/${driverId}`);
        nationalIdImageUrl = result.url;
    }

    await db.insert(drivers).values({
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

    SuccessResponse(res, { message: "Driver created successfully", driverId }, 201);
};

// ✅ Get All Drivers
export const getAllDrivers = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allDrivers = await db
        .select({
            id: drivers.id,
            name: drivers.name,
            phone: drivers.phone,
            avatar: drivers.avatar,
            licenseExpiry: drivers.licenseExpiry,
            email: drivers.email,
            licenseImage: drivers.licenseImage,
            nationalId: drivers.nationalId,
            nationalIdImage: drivers.nationalIdImage,
            status: drivers.status,
            createdAt: drivers.createdAt,
            updatedAt: drivers.updatedAt,
        })
        .from(drivers)
        .where(eq(drivers.organizationId, organizationId));

    SuccessResponse(res, { drivers: allDrivers }, 200);
};

// ✅ Get Driver By ID
export const getDriverById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const driver = await db
        .select({
            id: drivers.id,
            name: drivers.name,
            phone: drivers.phone,
            avatar: drivers.avatar,
            licenseExpiry: drivers.licenseExpiry,
            email: drivers.email,
            licenseImage: drivers.licenseImage,
            nationalId: drivers.nationalId,
            nationalIdImage: drivers.nationalIdImage,
            status: drivers.status,
            createdAt: drivers.createdAt,
            updatedAt: drivers.updatedAt,
        })
        .from(drivers)
        .where(and(eq(drivers.id, id), eq(drivers.organizationId, organizationId)))
        .limit(1);

    if (!driver[0]) {
        throw new NotFound("Driver not found");
    }

    SuccessResponse(res, { driver: driver[0] }, 200);
};

// ✅ Update Driver
export const updateDriver = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, password, email, avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingDriver = await db
        .select()
        .from(drivers)
        .where(and(eq(drivers.id, id), eq(drivers.organizationId, organizationId)))
        .limit(1);

    if (!existingDriver[0]) {
        throw new NotFound("Driver not found");
    }

    // Check if phone is being changed and already exists
    if (phone && phone !== existingDriver[0].phone) {
        const phoneExists = await db
            .select()
            .from(drivers)
            .where(eq(drivers.phone, phone))
            .limit(1);

        if (phoneExists[0]) {
            throw new BadRequest("Phone number already registered");
        }
    }

    // Handle password
    let hashedPassword = existingDriver[0].password;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    // Handle avatar
    let avatarUrl = existingDriver[0].avatar;
    if (avatar !== undefined) {
        if (existingDriver[0].avatar) {
            await deletePhotoFromServer(existingDriver[0].avatar);
        }
        if (avatar) {
            const result = await saveBase64Image(req, avatar, `drivers/${id}`);
            avatarUrl = result.url;
        } else {
            avatarUrl = null;
        }
    }

    // Handle license image
    let licenseImageUrl = existingDriver[0].licenseImage;
    if (licenseImage !== undefined) {
        if (existingDriver[0].licenseImage) {
            await deletePhotoFromServer(existingDriver[0].licenseImage);
        }
        if (licenseImage) {
            const result = await saveBase64Image(req, licenseImage, `drivers/${id}`);
            licenseImageUrl = result.url;
        } else {
            licenseImageUrl = null;
        }
    }

    // Handle national ID image
    let nationalIdImageUrl = existingDriver[0].nationalIdImage;
    if (nationalIdImage !== undefined) {
        if (existingDriver[0].nationalIdImage) {
            await deletePhotoFromServer(existingDriver[0].nationalIdImage);
        }
        if (nationalIdImage) {
            const result = await saveBase64Image(req, nationalIdImage, `drivers/${id}`);
            nationalIdImageUrl = result.url;
        } else {
            nationalIdImageUrl = null;
        }
    }

    await db.update(drivers).set({
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
    }).where(eq(drivers.id, id));

    SuccessResponse(res, { message: "Driver updated successfully" }, 200);
};

// ✅ Delete Driver
// ✅ Delete Driver
export const deleteDriver = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingDriver = await db
        .select()
        .from(drivers)
        .where(and(eq(drivers.id, id), eq(drivers.organizationId, organizationId)))
        .limit(1);

    if (!existingDriver[0]) {
        throw new NotFound("Driver not found");
    }

    // ✅ تحقق إن الـ Driver مش مرتبط برحلات
    const driverRides = await db
        .select({ id: rides.id })
        .from(rides)
        .where(eq(rides.driverId, id))
        .limit(1);

    if (driverRides.length > 0) {
        throw new BadRequest("Cannot delete driver. Driver is assigned to rides. Please reassign or delete the rides first.");
    }

    try {
        // Delete images
        if (existingDriver[0].avatar) {
            await deletePhotoFromServer(existingDriver[0].avatar);
        }
        if (existingDriver[0].licenseImage) {
            await deletePhotoFromServer(existingDriver[0].licenseImage);
        }
        if (existingDriver[0].nationalIdImage) {
            await deletePhotoFromServer(existingDriver[0].nationalIdImage);
        }

        await db.delete(drivers).where(eq(drivers.id, id));

        SuccessResponse(res, { message: "Driver deleted successfully" }, 200);
    } catch (error: any) {
        console.error("Delete Driver Error:", error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new BadRequest("Cannot delete driver. Driver is linked to other records.");
        }

        throw error;
    }
};


// ============================================
// ✅ 3) GET DRIVER FULL DETAILS
// ============================================
export const getDriverDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new NotFound("Organization not found");
    }

    // 1) بيانات السائق الأساسية
    const [driver] = await db
        .select()
        .from(drivers)
        .where(
            and(
                eq(drivers.id, id),
                eq(drivers.organizationId, organizationId)
            )
        )
        .limit(1);

    if (!driver) {
        throw new NotFound("Driver not found");
    }

    // 2) الرحلات المرتبطة بالسائق مع الباص والمشرف
    const driverRides = await db
        .select({
            rideId: rides.id,
            rideName: rides.name,
            rideType: rides.rideType,
            rideStatus: rides.status,
            rideIsActive: rides.isActive,
            startDate: rides.startDate,
            endDate: rides.endDate,
            frequency: rides.frequency,
            // Bus
            busId: buses.id,
            busNumber: buses.busNumber,
            busPlateNumber: buses.plateNumber,
            busImage: buses.busImage,
            busMaxSeats: buses.maxSeats,
            // Codriver
            codriverId: codrivers.id,
            codriverName: codrivers.name,
            codriverPhone: codrivers.phone,
            codriverAvatar: codrivers.avatar,
            // Route
            routeId: Rout.id,
            routeName: Rout.name,
        })
        .from(rides)
        .leftJoin(buses, eq(rides.busId, buses.id))
        .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
        .leftJoin(Rout, eq(rides.routeId, Rout.id))
        .where(eq(rides.driverId, id));

    // 3) الطلاب في رحلاته
    const driverStudents = await db
        .select({
            studentId: students.id,
            studentName: students.name,
            studentCode: students.code,
            studentAvatar: students.avatar,
            studentGrade: students.grade,
            studentClassroom: students.classroom,
            pickupTime: rideStudents.pickupTime,
            rideId: rides.id,
            rideName: rides.name,
            rideType: rides.rideType,
            // Pickup Point
            pickupPointId: pickupPoints.id,
            pickupPointName: pickupPoints.name,
            // Parent
            parentName: parents.name,
            parentPhone: parents.phone,
        })
        .from(rideStudents)
        .innerJoin(rides, eq(rideStudents.rideId, rides.id))
        .innerJoin(students, eq(rideStudents.studentId, students.id))
        .leftJoin(parents, eq(students.parentId, parents.id))
        .leftJoin(pickupPoints, eq(rideStudents.pickupPointId, pickupPoints.id))
        .where(eq(rides.driverId, id));

    // 4) سجل الرحلات (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rideHistory = await db
        .select({
            occurrenceId: rideOccurrences.id,
            date: rideOccurrences.occurDate,
            status: rideOccurrences.status,
            startedAt: rideOccurrences.startedAt,
            completedAt: rideOccurrences.completedAt,
            rideName: rides.name,
            rideType: rides.rideType,
            busNumber: buses.busNumber,
        })
        .from(rideOccurrences)
        .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
        .leftJoin(buses, eq(rides.busId, buses.id))
        .where(
            and(
                eq(rides.driverId, id),
                gte(rideOccurrences.occurDate, new Date(thirtyDaysAgo.toISOString().split('T')[0]))
            )
        )
        .orderBy(desc(rideOccurrences.occurDate))
        .limit(50);

    // 5) الرحلات القادمة (7 أيام)
    const today = new Date(new Date().toISOString().split('T')[0]);
    const nextWeek = new Date(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

    const upcomingRides = await db
        .select({
            occurrenceId: rideOccurrences.id,
            date: rideOccurrences.occurDate,
            status: rideOccurrences.status,
            rideId: rides.id,
            rideName: rides.name,
            rideType: rides.rideType,
            busNumber: buses.busNumber,
            busPlateNumber: buses.plateNumber,
        })
        .from(rideOccurrences)
        .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
        .leftJoin(buses, eq(rides.busId, buses.id))
        .where(
            and(
                eq(rides.driverId, id),
                gte(rideOccurrences.occurDate, today),
                lte(rideOccurrences.occurDate, nextWeek)
            )
        )
        .orderBy(rideOccurrences.occurDate)
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

    SuccessResponse(
        res,
        {
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
        },
        200
    );
};