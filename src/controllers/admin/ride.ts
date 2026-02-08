// src/controllers/admin/rideController.ts
import { Request, Response } from "express";
import { db } from "../../models/db";
import {
  rides,
  rideStudents,
  rideOccurrences,
  rideOccurrenceStudents,
  buses,
  drivers,
  codrivers,
  Rout,
  routePickupPoints,
  students,
  pickupPoints,
  parents,
} from "../../models/schema";
import { eq, and, inArray, count, sql, gte, desc, asc, lte } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { v4 as uuidv4 } from "uuid";

// ================== HELPERS ==================

const checkBusCapacity = async (
  busId: string,
  rideId: string | null,
  newStudentsCount: number
): Promise<void> => {
  const [bus] = await db
    .select({ maxSeats: buses.maxSeats })
    .from(buses)
    .where(eq(buses.id, busId))
    .limit(1);

  if (!bus) {
    throw new NotFound("Bus not found");
  }

  let currentStudentsCount = 0;
  if (rideId) {
    const [result] = await db
      .select({ count: count() })
      .from(rideStudents)
      .where(eq(rideStudents.rideId, rideId));
    currentStudentsCount = result.count;
  }

  const totalStudents = currentStudentsCount + newStudentsCount;

  if (totalStudents > bus.maxSeats) {
    throw new BadRequest(
      `Bus capacity exceeded. Max: ${bus.maxSeats}, Current: ${currentStudentsCount}, Trying to add: ${newStudentsCount}`
    );
  }
};

const generateOccurrences = async (
  rideId: string,
  startDate: string,
  endDate: string | null,
  frequency: string,
  repeatType: string | null,
  studentsData: any[]
): Promise<number> => {
  const occurrences: any[] = [];
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === "once") {
    occurrences.push({
      id: uuidv4(),
      rideId,
      occurDate: startDate,
    });
  } else if (frequency === "repeat") {
    let generateUntil: Date;

    if (repeatType === "limited" && endDate) {
      generateUntil = new Date(endDate);
    } else {
      // ✅ unlimited: توليد 30 يوم من اليوم أو startDate (الأكبر)
      generateUntil = new Date(Math.max(today.getTime(), start.getTime()));
      generateUntil.setDate(generateUntil.getDate() + 30);
    }

    const current = new Date(start);
    while (current <= generateUntil) {
      occurrences.push({
        id: uuidv4(),
        rideId,
        occurDate: current.toISOString().split("T")[0],
      });
      current.setDate(current.getDate() + 1);
    }
  }

  if (occurrences.length > 0) {
    await db.insert(rideOccurrences).values(occurrences);

    for (const occ of occurrences) {
      if (studentsData.length > 0) {
        const occStudents = studentsData.map((s: any) => ({
          id: uuidv4(),
          occurrenceId: occ.id,
          studentId: s.studentId,
          pickupPointId: s.pickupPointId,
          pickupTime: s.pickupTime || null,
        }));
        await db.insert(rideOccurrenceStudents).values(occStudents);
      }
    }
  }

  return occurrences.length;
};

// ================== CONTROLLERS ==================

// ✅ Create Ride
export const createRide = async (req: Request, res: Response) => {
  const {
    busId,
    driverId,
    codriverId,
    routeId,
    name,
    rideType,
    frequency,
    repeatType,
    startDate,
    endDate,
    students: rideStudentsData = [],
  } = req.body;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!busId || !driverId || !routeId || !rideType || !frequency || !startDate) {
    throw new BadRequest("Missing required fields");
  }

  // ✅ التحقق من frequency و repeatType
  if (frequency === "repeat") {
    if (!repeatType) {
      throw new BadRequest("Repeat type is required for repeating rides");
    }

    if (repeatType === "limited") {
      if (!endDate) {
        throw new BadRequest("End date is required for limited repeat rides");
      }
      if (new Date(endDate) <= new Date(startDate)) {
        throw new BadRequest("End date must be after start date");
      }
    }

    if (repeatType === "unlimited" && endDate) {
      console.log("Warning: endDate ignored for unlimited rides");
    }
  }

  // ✅ حساب نطاق التواريخ للفحص
  const checkStartDate = new Date(startDate);
  let checkEndDate: Date;

  if (frequency === "once") {
    checkEndDate = checkStartDate;
  } else if (frequency === "repeat" && repeatType === "limited" && endDate) {
    checkEndDate = new Date(endDate);
  } else {
    // unlimited: نفحص 30 يوم قدام
    checkEndDate = new Date(checkStartDate);
    checkEndDate.setDate(checkEndDate.getDate() + 30);
  }

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // ✅ 1) فحص تعارض السائق
  const driverConflict = await db
    .select({
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      occurDate: rideOccurrences.occurDate,
    })
    .from(rides)
    .innerJoin(rideOccurrences, eq(rides.id, rideOccurrences.rideId))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        eq(rides.driverId, driverId),
        eq(rides.rideType, rideType),
        gte(rideOccurrences.occurDate, checkStartDate),
        lte(rideOccurrences.occurDate, checkEndDate),
        inArray(rideOccurrences.status, ["scheduled", "in_progress"])
      )
    )
    .limit(1);

  if (driverConflict.length > 0) {
    const conflict = driverConflict[0];
    throw new BadRequest(
      `Driver is already assigned to ride "${conflict.rideName || conflict.rideId}" on ${conflict.occurDate} (${conflict.rideType})`
    );
  }

  // ✅ 2) فحص تعارض الكو-درايفر
  if (codriverId) {
    const codriverConflict = await db
      .select({
        rideId: rides.id,
        rideName: rides.name,
        rideType: rides.rideType,
        occurDate: rideOccurrences.occurDate,
      })
      .from(rides)
      .innerJoin(rideOccurrences, eq(rides.id, rideOccurrences.rideId))
      .where(
        and(
          eq(rides.organizationId, organizationId),
          eq(rides.codriverId, codriverId),
          eq(rides.rideType, rideType),
          gte(rideOccurrences.occurDate, checkStartDate),
          lte(rideOccurrences.occurDate, checkEndDate),
          inArray(rideOccurrences.status, ["scheduled", "in_progress"])
        )
      )
      .limit(1);

    if (codriverConflict.length > 0) {
      const conflict = codriverConflict[0];
      throw new BadRequest(
        `Codriver is already assigned to ride "${conflict.rideName || conflict.rideId}" on ${conflict.occurDate} (${conflict.rideType})`
      );
    }
  }

  // ✅ 3) فحص تعارض الباص
  const busConflict = await db
    .select({
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      occurDate: rideOccurrences.occurDate,
    })
    .from(rides)
    .innerJoin(rideOccurrences, eq(rides.id, rideOccurrences.rideId))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        eq(rides.busId, busId),
        eq(rides.rideType, rideType),
        gte(rideOccurrences.occurDate, checkStartDate),
        lte(rideOccurrences.occurDate, checkEndDate),
        inArray(rideOccurrences.status, ["scheduled", "in_progress"])
      )
    )
    .limit(1);

  if (busConflict.length > 0) {
    const conflict = busConflict[0];
    throw new BadRequest(
      `Bus is already assigned to ride "${conflict.rideName || conflict.rideId}" on ${conflict.occurDate} (${conflict.rideType})`
    );
  }

  // ✅ 4) فحص تعارض الطلاب
  if (rideStudentsData.length > 0) {
    const studentIds = rideStudentsData.map((s: any) => s.studentId);

    const studentConflicts = await db
      .select({
        studentId: rideStudents.studentId,
        studentName: students.name,
        rideName: rides.name,
        rideType: rides.rideType,
        occurDate: rideOccurrences.occurDate,
      })
      .from(rideStudents)
      .innerJoin(rides, eq(rideStudents.rideId, rides.id))
      .innerJoin(rideOccurrences, eq(rides.id, rideOccurrences.rideId))
      .innerJoin(students, eq(rideStudents.studentId, students.id))
      .where(
        and(
          eq(rides.organizationId, organizationId),
          eq(rides.rideType, rideType),
          inArray(rideStudents.studentId, studentIds),
          gte(rideOccurrences.occurDate, checkStartDate),
          lte(rideOccurrences.occurDate, checkEndDate),
          inArray(rideOccurrences.status, ["scheduled", "in_progress"])
        )
      )
      .limit(5);

    if (studentConflicts.length > 0) {
      const conflictNames = studentConflicts
        .map((c) => `${c.studentName} (${c.occurDate})`)
        .join(", ");
      throw new BadRequest(
        `Students already assigned to another ${rideType} ride: ${conflictNames}`
      );
    }
  }

  // ✅ التحقق من وجود الموارد
  const bus = await db
    .select()
    .from(buses)
    .where(and(eq(buses.id, busId), eq(buses.organizationId, organizationId)))
    .limit(1);
  if (!bus[0]) throw new NotFound("Bus not found");

  if (rideStudentsData.length > 0) {
    await checkBusCapacity(busId, null, rideStudentsData.length);
  }

  const driver = await db
    .select()
    .from(drivers)
    .where(and(eq(drivers.id, driverId), eq(drivers.organizationId, organizationId)))
    .limit(1);
  if (!driver[0]) throw new NotFound("Driver not found");

  if (codriverId) {
    const codriver = await db
      .select()
      .from(codrivers)
      .where(and(eq(codrivers.id, codriverId), eq(codrivers.organizationId, organizationId)))
      .limit(1);
    if (!codriver[0]) throw new NotFound("Codriver not found");
  }

  const route = await db
    .select()
    .from(Rout)
    .where(and(eq(Rout.id, routeId), eq(Rout.organizationId, organizationId)))
    .limit(1);
  if (!route[0]) throw new NotFound("Route not found");

  // ✅ التحقق من الطلاب ونقاط الالتقاط
  if (rideStudentsData.length > 0) {
    const routePickupPointsList = await db
      .select()
      .from(routePickupPoints)
      .where(eq(routePickupPoints.routeId, routeId));
    const validPickupPointIds = routePickupPointsList.map((p) => p.pickupPointId);

    const studentIds = rideStudentsData.map((s: any) => s.studentId);
    const uniqueStudentIds = [...new Set(studentIds)];
    if (uniqueStudentIds.length !== studentIds.length) {
      throw new BadRequest("Duplicate students not allowed");
    }

    const existingStudents = await db
      .select()
      .from(students)
      .where(and(inArray(students.id, studentIds), eq(students.organizationId, organizationId)));

    if (existingStudents.length !== studentIds.length) {
      throw new BadRequest("One or more students not found");
    }

    for (const s of rideStudentsData) {
      if (!validPickupPointIds.includes(s.pickupPointId)) {
        throw new BadRequest(`Pickup point ${s.pickupPointId} not found in this route`);
      }
    }
  }

  // ✅ إنشاء الرحلة
  const rideId = uuidv4();

  await db.insert(rides).values({
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
    const rideStudentsInsert = rideStudentsData.map((s: any) => ({
      id: uuidv4(),
      rideId,
      studentId: s.studentId,
      pickupPointId: s.pickupPointId,
      pickupTime: s.pickupTime || null,
    }));
    await db.insert(rideStudents).values(rideStudentsInsert);
  }

  const occurrencesCount = await generateOccurrences(
    rideId,
    startDate,
    frequency === "repeat" && repeatType === "limited" ? endDate : null,
    frequency,
    repeatType,
    rideStudentsData
  );

  SuccessResponse(
    res,
    {
      message: "Ride created successfully",
      rideId,
      frequency,
      repeatType: repeatType || null,
      studentsCount: rideStudentsData.length,
      occurrencesGenerated: occurrencesCount,
    },
    201
  );
};


// ✅ Get All Rides with Classification
export const getAllRides = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;
  const { tab } = req.query;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const today = new Date().toISOString().split("T")[0];

  const allRides = await db
    .select({
      id: rides.id,
      name: rides.name,
      rideType: rides.rideType,
      frequency: rides.frequency,
      repeatType: rides.repeatType,
      startDate: rides.startDate,
      endDate: rides.endDate,
      isActive: rides.isActive,
      createdAt: rides.createdAt,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rides)
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(eq(rides.organizationId, organizationId))
    .orderBy(desc(rides.createdAt));

  const rideIds = allRides.map((r) => r.id);

  let studentsCountMap: Record<string, number> = {};
  if (rideIds.length > 0) {
    const studentsCounts = await db
      .select({
        rideId: rideStudents.rideId,
        count: count(),
      })
      .from(rideStudents)
      .where(inArray(rideStudents.rideId, rideIds))
      .groupBy(rideStudents.rideId);

    studentsCountMap = studentsCounts.reduce((acc, item) => {
      acc[item.rideId] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }

  let todayOccurrenceMap: Record<string, any> = {};
  if (rideIds.length > 0) {
    const todayOccurrences = await db
      .select({
        rideId: rideOccurrences.rideId,
        occurrenceId: rideOccurrences.id,
        status: rideOccurrences.status,
        startedAt: rideOccurrences.startedAt,
        completedAt: rideOccurrences.completedAt,
      })
      .from(rideOccurrences)
      .where(
        and(
          inArray(rideOccurrences.rideId, rideIds),
          sql`DATE(${rideOccurrences.occurDate}) = ${today}`
        )
      );

    todayOccurrenceMap = todayOccurrences.reduce((acc, item) => {
      acc[item.rideId] = {
        occurrenceId: item.occurrenceId,
        status: item.status,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
      };
      return acc;
    }, {} as Record<string, any>);
  }

  let nextOccurrenceMap: Record<string, string> = {};
  if (rideIds.length > 0) {
    const nextOccurrences = await db
      .select({
        rideId: rideOccurrences.rideId,
        occurDate: sql<string>`MIN(DATE(${rideOccurrences.occurDate}))`,
      })
      .from(rideOccurrences)
      .where(
        and(
          inArray(rideOccurrences.rideId, rideIds),
          sql`DATE(${rideOccurrences.occurDate}) > ${today}`,
          eq(rideOccurrences.status, "scheduled")
        )
      )
      .groupBy(rideOccurrences.rideId);

    nextOccurrenceMap = nextOccurrences.reduce((acc, item) => {
      acc[item.rideId] = item.occurDate;
      return acc;
    }, {} as Record<string, string>);
  }

  const formatRide = (ride: any) => {
    const todayOcc = todayOccurrenceMap[ride.id];
    const nextOccDate = nextOccurrenceMap[ride.id];

    let classification: "upcoming" | "current" | "past";
    let currentStatus: string | null = null;

    if (todayOcc) {
      currentStatus = todayOcc.status;

      if (todayOcc.status === "in_progress") {
        classification = "current";
      } else if (todayOcc.status === "scheduled") {
        classification = "current";
      } else if (todayOcc.status === "completed" || todayOcc.status === "cancelled") {
        // ✅ الرحلة خلصت/اتلغت النهارده - شوف لو فيه قادمة
        if (nextOccDate) {
          classification = "upcoming";
        } else {
          classification = "past";
        }
      } else {
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
  const statusOrder: Record<string, number> = {
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
  } else if (tab === "current") {
    result = current;
  } else if (tab === "past") {
    result = past;
  }

  SuccessResponse(res, {
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

// ✅ Get Ride By ID
export const getRideById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const ride = await db
    .select({
      id: rides.id,
      name: rides.name,
      rideType: rides.rideType,
      frequency: rides.frequency,
      repeatType: rides.repeatType,
      startDate: rides.startDate,
      endDate: rides.endDate,
      isActive: rides.isActive,
      createdAt: rides.createdAt,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      busMaxSeats: buses.maxSeats,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      codriverPhone: codrivers.phone,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rides)
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(and(eq(rides.id, id), eq(rides.organizationId, organizationId)))
    .limit(1);

  if (!ride[0]) {
    throw new NotFound("Ride not found");
  }

  const rideData = ride[0];

  const rideStudentsList = await db
    .select({
      id: rideStudents.id,
      pickupTime: rideStudents.pickupTime,
      studentId: students.id,
      studentName: students.name,
      studentAvatar: students.avatar,
      studentGrade: students.grade,
      studentClassroom: students.classroom,
      parentId: parents.id,
      parentName: parents.name,
      parentPhone: parents.phone,
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
    })
    .from(rideStudents)
    .innerJoin(students, eq(rideStudents.studentId, students.id))
    .leftJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(pickupPoints, eq(rideStudents.pickupPointId, pickupPoints.id))
    .where(eq(rideStudents.rideId, id));

  let routeStops: any[] = [];
  if (rideData.routeId) {
    routeStops = await db
      .select({
        id: pickupPoints.id,
        name: pickupPoints.name,
        address: pickupPoints.address,
        lat: pickupPoints.lat,
        lng: pickupPoints.lng,
        stopOrder: routePickupPoints.stopOrder,
      })
      .from(routePickupPoints)
      .innerJoin(pickupPoints, eq(pickupPoints.id, routePickupPoints.pickupPointId))
      .where(eq(routePickupPoints.routeId, rideData.routeId))
      .orderBy(routePickupPoints.stopOrder);
  }

  const recentOccurrences = await db
    .select()
    .from(rideOccurrences)
    .where(eq(rideOccurrences.rideId, id))
    .orderBy(desc(rideOccurrences.occurDate))
    .limit(10);

  SuccessResponse(res, {
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

// ✅ Get Rides By Date (Occurrences)
export const getRidesByDate = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;
  const { date } = req.body;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const targetDate = date ? String(date) : new Date().toISOString().split("T")[0];

  const dayOccurrences = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      frequency: rides.frequency,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        eq(rides.isActive, "on"),
        sql`DATE(${rideOccurrences.occurDate}) = ${targetDate}`
      )
    )
    .orderBy(rides.rideType, rideOccurrences.createdAt);

  const occurrenceIds = dayOccurrences.map((o) => o.occurrenceId);
  let studentsStatsMap: Record<string, any> = {};

  if (occurrenceIds.length > 0) {
    const studentsStats = await db
      .select({
        occurrenceId: rideOccurrenceStudents.occurrenceId,
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
        pickedUp: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
        droppedOff: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
        absent: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
        excused: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
      })
      .from(rideOccurrenceStudents)
      .where(inArray(rideOccurrenceStudents.occurrenceId, occurrenceIds))
      .groupBy(rideOccurrenceStudents.occurrenceId);

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
    }, {} as Record<string, any>);
  }

  const formatOccurrence = (occ: any) => {
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

  SuccessResponse(res, {
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

// ✅ Get Upcoming Rides
export const getUpcomingRides = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;
  const { limit = 20 } = req.query;
  const today = new Date().toISOString().split("T")[0];

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const upcomingOccurrences = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      busId: buses.id,
      busNumber: buses.busNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        eq(rides.isActive, "on"),
        sql`DATE(${rideOccurrences.occurDate}) >= ${today}`,
        eq(rideOccurrences.status, "scheduled")
      )
    )
    .orderBy(asc(rideOccurrences.occurDate))
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

  SuccessResponse(res, { upcoming: result, count: result.length }, 200);
};

// ✅ Get Occurrence Details
export const getOccurrenceDetails = async (req: Request, res: Response) => {
  const { occurrenceId } = req.params;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!occurrenceId) {
    throw new BadRequest("Occurrence ID is required");
  }

  const occurrence = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      frequency: rides.frequency,
      repeatType: rides.repeatType,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      busMaxSeats: buses.maxSeats,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      codriverPhone: codrivers.phone,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Occurrence not found");
  }

  const occ = occurrence[0];
  const occId = occ.occurrenceId;

  const occStudents = await db
    .select({
      id: rideOccurrenceStudents.id,
      status: rideOccurrenceStudents.status,
      pickupTime: rideOccurrenceStudents.pickupTime,
      excuseReason: rideOccurrenceStudents.excuseReason,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      studentId: students.id,
      studentName: students.name,
      studentAvatar: students.avatar,
      studentGrade: students.grade,
      studentClassroom: students.classroom,
      parentId: parents.id,
      parentName: parents.name,
      parentPhone: parents.phone,
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
      stopOrder: routePickupPoints.stopOrder,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(students, eq(rideOccurrenceStudents.studentId, students.id))
    .leftJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(pickupPoints, eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id))
    .leftJoin(
      routePickupPoints,
      and(
        eq(routePickupPoints.pickupPointId, rideOccurrenceStudents.pickupPointId),
        eq(routePickupPoints.routeId, occ.routeId!)
      )
    )
    .where(eq(rideOccurrenceStudents.occurrenceId, occId))
    .orderBy(routePickupPoints.stopOrder);

  const formatStudent = (s: any) => ({
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

  let routeStops: any[] = [];
  if (occ.routeId) {
    routeStops = await db
      .select({
        id: pickupPoints.id,
        name: pickupPoints.name,
        address: pickupPoints.address,
        lat: pickupPoints.lat,
        lng: pickupPoints.lng,
        stopOrder: routePickupPoints.stopOrder,
      })
      .from(routePickupPoints)
      .innerJoin(pickupPoints, eq(pickupPoints.id, routePickupPoints.pickupPointId))
      .where(eq(routePickupPoints.routeId, occ.routeId))
      .orderBy(routePickupPoints.stopOrder);

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

// ✅ Update Ride
export const updateRide = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    busId,
    driverId,
    codriverId,
    routeId,
    name,
    rideType,
    isActive,
    students: studentsData
  } = req.body;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const existingRide = await db
    .select()
    .from(rides)
    .where(and(eq(rides.id, id), eq(rides.organizationId, organizationId)))
    .limit(1);

  if (!existingRide[0]) throw new NotFound("Ride not found");

  if (busId) {
    const bus = await db.select().from(buses)
      .where(and(eq(buses.id, busId), eq(buses.organizationId, organizationId))).limit(1);
    if (!bus[0]) throw new NotFound("Bus not found");
  }

  if (driverId) {
    const driver = await db.select().from(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.organizationId, organizationId))).limit(1);
    if (!driver[0]) throw new NotFound("Driver not found");
  }

  if (codriverId) {
    const codriver = await db.select().from(codrivers)
      .where(and(eq(codrivers.id, codriverId), eq(codrivers.organizationId, organizationId))).limit(1);
    if (!codriver[0]) throw new NotFound("Codriver not found");
  }

  if (routeId) {
    const route = await db.select().from(Rout)
      .where(and(eq(Rout.id, routeId), eq(Rout.organizationId, organizationId))).limit(1);
    if (!route[0]) throw new NotFound("Route not found");
  }

  await db.update(rides).set({
    busId: busId ?? existingRide[0].busId,
    driverId: driverId ?? existingRide[0].driverId,
    codriverId: codriverId !== undefined ? codriverId : existingRide[0].codriverId,
    routeId: routeId ?? existingRide[0].routeId,
    name: name !== undefined ? name : existingRide[0].name,
    rideType: rideType ?? existingRide[0].rideType,
    isActive: isActive ?? existingRide[0].isActive,
  }).where(eq(rides.id, id));

  let studentsUpdated = false;
  if (studentsData && Array.isArray(studentsData)) {
    await updateRideStudents(id, studentsData, organizationId);
    studentsUpdated = true;
  }

  SuccessResponse(res, {
    message: "Ride updated successfully",
    studentsUpdated,
  }, 200);
};

// ✅ دالة تحديث الطلاب
async function updateRideStudents(
  rideId: string,
  studentsData: Array<{ studentId: string; pickupPointId: string; pickupTime?: string }>,
  organizationId: string
) {
  const currentStudents = await db
    .select()
    .from(rideStudents)
    .where(eq(rideStudents.rideId, rideId));

  const currentStudentIds = currentStudents.map(s => s.studentId);
  const newStudentIds = studentsData.map(s => s.studentId);

  const toAdd = studentsData.filter(s => !currentStudentIds.includes(s.studentId));
  const toRemove = currentStudents.filter(s => !newStudentIds.includes(s.studentId));
  const toUpdate = studentsData.filter(s => currentStudentIds.includes(s.studentId));

  const futureOccurrences = await db
    .select({ id: rideOccurrences.id })
    .from(rideOccurrences)
    .where(
      and(
        eq(rideOccurrences.rideId, rideId),
        gte(rideOccurrences.occurDate, new Date()),
        eq(rideOccurrences.status, "scheduled")
      )
    );

  const futureOccIds = futureOccurrences.map(o => o.id);

  if (toRemove.length > 0) {
    const removeIds = toRemove.map(s => s.studentId);

    await db.delete(rideStudents)
      .where(and(
        eq(rideStudents.rideId, rideId),
        inArray(rideStudents.studentId, removeIds)
      ));

    if (futureOccIds.length > 0) {
      await db.delete(rideOccurrenceStudents)
        .where(and(
          inArray(rideOccurrenceStudents.occurrenceId, futureOccIds),
          inArray(rideOccurrenceStudents.studentId, removeIds)
        ));
    }
  }

  if (toAdd.length > 0) {
    const rideStudentsToAdd = toAdd.map(s => ({
      rideId,
      studentId: s.studentId,
      pickupPointId: s.pickupPointId,
      pickupTime: s.pickupTime || null,
    }));
    await db.insert(rideStudents).values(rideStudentsToAdd);

    if (futureOccIds.length > 0) {
      const occStudentsToAdd: any[] = [];
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
      await db.insert(rideOccurrenceStudents).values(occStudentsToAdd);
    }
  }

  for (const student of toUpdate) {
    await db.update(rideStudents).set({
      pickupPointId: student.pickupPointId,
      pickupTime: student.pickupTime || null,
    }).where(and(
      eq(rideStudents.rideId, rideId),
      eq(rideStudents.studentId, student.studentId)
    ));

    if (futureOccIds.length > 0) {
      await db.update(rideOccurrenceStudents).set({
        pickupPointId: student.pickupPointId,
        pickupTime: student.pickupTime || null,
      }).where(and(
        inArray(rideOccurrenceStudents.occurrenceId, futureOccIds),
        eq(rideOccurrenceStudents.studentId, student.studentId)
      ));
    }
  }
}

// ✅ Delete Ride
export const deleteRide = async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const existingRide = await db
    .select()
    .from(rides)
    .where(and(eq(rides.id, id), eq(rides.organizationId, organizationId)))
    .limit(1);

  if (!existingRide[0]) throw new NotFound("Ride not found");

  await db.delete(rideStudents).where(eq(rideStudents.rideId, id));
  await db.delete(rides).where(eq(rides.id, id));

  SuccessResponse(res, { message: "Ride deleted successfully" }, 200);
};

// ✅ Update Occurrence Status
export const updateOccurrenceStatus = async (req: Request, res: Response) => {
  const { occurrenceId } = req.params;
  const { status } = req.body;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!occurrenceId) {
    throw new BadRequest("Occurrence ID is required");
  }

  if (!status || !["scheduled", "cancelled"].includes(status)) {
    throw new BadRequest("Invalid status. Use 'scheduled' or 'cancelled'");
  }

  const occurrence = await db
    .select({
      occId: rideOccurrences.id,
      status: rideOccurrences.status,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Occurrence not found");
  }

  if (occurrence[0].status === "in_progress" || occurrence[0].status === "completed") {
    throw new BadRequest("Cannot change status of in-progress or completed occurrence");
  }

  await db
    .update(rideOccurrences)
    .set({ status, updatedAt: new Date() })
    .where(eq(rideOccurrences.id, occurrenceId));

  res.json({
    success: true,
    message: "Occurrence status updated successfully",
  });
};

// ✅ Selection Data
export const selection = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  // ✅ فلترة الـ routes الـ active بس
  const allRoutes = await db
    .select()
    .from(Rout)

  const routesWithPickupPoints = await Promise.all(
    allRoutes.map(async (route) => {
      const points = await db
        .select({
          id: routePickupPoints.id,
          stopOrder: routePickupPoints.stopOrder,
          pickupPointId: pickupPoints.id,
          pickupPointName: pickupPoints.name,
          pickupPointAddress: pickupPoints.address,
          pickupPointLat: pickupPoints.lat,
          pickupPointLng: pickupPoints.lng,
        })
        .from(routePickupPoints)
        .leftJoin(pickupPoints, eq(routePickupPoints.pickupPointId, pickupPoints.id))
        .where(eq(routePickupPoints.routeId, route.id))
        .orderBy(routePickupPoints.stopOrder);

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
    })
  );

  // ✅ فلترة الـ buses الـ active بس
  const allBuses = await db
    .select()
    .from(buses)

  // ✅ فلترة الـ drivers الـ active بس
  const allDrivers = await db
    .select()
    .from(drivers)

  // ✅ فلترة الـ codrivers الـ active بس
  const allCodrivers = await db
    .select()
    .from(codrivers)

  // ✅ فلترة الـ students الـ active بس
  const studentsData = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      parentId: parents.id,
      parentName: parents.name,
      parentPhone: parents.phone,
    })
    .from(students)
    .leftJoin(parents, eq(students.parentId, parents.id))
    .where(and(eq(students.organizationId, organizationId), eq(students.status, "active")));

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

  SuccessResponse(res, {
    routes: routesWithPickupPoints,
    buses: allBuses,
    drivers: allDrivers,
    codrivers: allCodrivers,
    students: allStudents,
  }, 200);
};

// ✅ Search Students
// ✅ Search Students
export const searchStudentsForRide = async (req: Request, res: Response) => {
  const { phone, name, parentName } = req.query;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!phone && !name && !parentName) {
    throw new BadRequest("Please provide search criteria");
  }

  let conditions: any[] = [
    eq(students.organizationId, organizationId),
    eq(students.status, "active"), // ✅ فلترة الـ active بس
  ];

  if (phone) {
    conditions.push(sql`${parents.phone} LIKE ${`%${phone}%`}`);
  }
  if (name) {
    conditions.push(sql`${students.name} LIKE ${`%${name}%`}`);
  }
  if (parentName) {
    conditions.push(sql`${parents.name} LIKE ${`%${parentName}%`}`);
  }

  const results = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      parent: {
        id: parents.id,
        name: parents.name,
        phone: parents.phone,
      },
    })
    .from(students)
    .leftJoin(parents, eq(students.parentId, parents.id))
    .where(and(...conditions))
    .limit(20);

  SuccessResponse(res, { students: results, count: results.length }, 200);
};

// ✅ Get Current Live Rides (للمتابعة اللحظية)
export const getCurrentRides = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const today = new Date().toISOString().split("T")[0];

  // جلب الرحلات الجارية
  const liveRides = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      status: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      frequency: rides.frequency,
      repeatType: rides.repeatType,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      busMaxSeats: buses.maxSeats,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      codriverPhone: codrivers.phone,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        eq(rideOccurrences.status, "in_progress"),
        sql`DATE(${rideOccurrences.occurDate}) = ${today}`
      )
    )
    .orderBy(rideOccurrences.startedAt);

  // جلب كل التفاصيل لكل رحلة
  const result = await Promise.all(
    liveRides.map(async (ride) => {
      // ✅ جلب الطلاب مع تفاصيلهم الكاملة
      const occStudents = await db
        .select({
          id: rideOccurrenceStudents.id,
          status: rideOccurrenceStudents.status,
          pickupTime: rideOccurrenceStudents.pickupTime,
          pickedUpAt: rideOccurrenceStudents.pickedUpAt,
          droppedOffAt: rideOccurrenceStudents.droppedOffAt,
          excuseReason: rideOccurrenceStudents.excuseReason,
          studentId: students.id,
          studentName: students.name,
          studentAvatar: students.avatar,
          studentGrade: students.grade,
          studentClassroom: students.classroom,
          parentId: parents.id,
          parentName: parents.name,
          parentPhone: parents.phone,
          pickupPointId: pickupPoints.id,
          pickupPointName: pickupPoints.name,
          pickupPointAddress: pickupPoints.address,
          pickupPointLat: pickupPoints.lat,
          pickupPointLng: pickupPoints.lng,
          stopOrder: routePickupPoints.stopOrder,
        })
        .from(rideOccurrenceStudents)
        .innerJoin(students, eq(rideOccurrenceStudents.studentId, students.id))
        .leftJoin(parents, eq(students.parentId, parents.id))
        .leftJoin(pickupPoints, eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id))
        .leftJoin(
          routePickupPoints,
          and(
            eq(routePickupPoints.pickupPointId, rideOccurrenceStudents.pickupPointId),
            ride.routeId ? eq(routePickupPoints.routeId, ride.routeId) : sql`1=1`
          )
        )
        .where(eq(rideOccurrenceStudents.occurrenceId, ride.occurrenceId))
        .orderBy(asc(routePickupPoints.stopOrder));

      // ✅ جلب نقاط التوقف (Route Stops)
      let routeStops: any[] = [];
      if (ride.routeId) {
        routeStops = await db
          .select({
            id: pickupPoints.id,
            name: pickupPoints.name,
            address: pickupPoints.address,
            lat: pickupPoints.lat,
            lng: pickupPoints.lng,
            stopOrder: routePickupPoints.stopOrder,
          })
          .from(routePickupPoints)
          .innerJoin(pickupPoints, eq(pickupPoints.id, routePickupPoints.pickupPointId))
          .where(eq(routePickupPoints.routeId, ride.routeId))
          .orderBy(asc(routePickupPoints.stopOrder));

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
      let currentStop: { id: any; name: any; stopOrder: any; } | null = null;
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
          currentLocation:
            ride.currentLat && ride.currentLng
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
    })
  );

  // تصنيف حسب النوع
  const morning = result.filter((r) => r.ride.type === "morning");
  const afternoon = result.filter((r) => r.ride.type === "afternoon");

  // إحصائيات إجمالية
  const totalStudents = result.reduce((sum, r) => sum + r.students.stats.total, 0);
  const totalPickedUp = result.reduce((sum, r) => sum + r.students.stats.pickedUp, 0);
  const totalOnBus = result.reduce((sum, r) => sum + r.students.stats.onBus, 0);

  SuccessResponse(
    res,
    {
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
    },
    200
  );
};

// ✅ Get Rides Dashboard Stats
export const getRidesDashboard = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const today = new Date().toISOString().split("T")[0];

  // إحصائيات اليوم
  const [todayStats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      scheduled: sql<number>`SUM(CASE WHEN ${rideOccurrences.status} = 'scheduled' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN ${rideOccurrences.status} = 'in_progress' THEN 1 ELSE 0 END)`,
      completed: sql<number>`SUM(CASE WHEN ${rideOccurrences.status} = 'completed' THEN 1 ELSE 0 END)`,
      cancelled: sql<number>`SUM(CASE WHEN ${rideOccurrences.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        sql`DATE(${rideOccurrences.occurDate}) = ${today}`
      )
    );

  // إحصائيات الطلاب اليوم
  const [studentsStats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      pending: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
      pickedUp: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
      droppedOff: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
      absent: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
      excused: sql<number>`SUM(CASE WHEN ${rideOccurrenceStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(rideOccurrences, eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id))
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        sql`DATE(${rideOccurrences.occurDate}) = ${today}`
      )
    );

  // إجمالي الرحلات النشطة
  const [totalRides] = await db
    .select({ count: count() })
    .from(rides)
    .where(
      and(
        eq(rides.organizationId, organizationId),
        eq(rides.isActive, "on")
      )
    );

  // الباصات والسائقين النشطين
  const [activeBuses] = await db
    .select({ count: count() })
    .from(buses)
    .where(
      and(
        eq(buses.organizationId, organizationId),
        eq(buses.status, "active")
      )
    );

  const [activeDrivers] = await db
    .select({ count: count() })
    .from(drivers)
    .where(
      and(
        eq(drivers.organizationId, organizationId),
        eq(drivers.status, "active")
      )
    );

  SuccessResponse(
    res,
    {
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
    },
    200
  );
};
