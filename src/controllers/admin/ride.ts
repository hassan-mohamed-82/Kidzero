// src/controllers/admin/rideController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { rides, rideStudents, buses, drivers, codrivers, Rout, routePickupPoints, students, pickupPoints,parents } from "../../models/schema";
import { eq, and, inArray,count,sql } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { v4 as uuidv4 } from "uuid";

// ✅ Create Ride
const checkBusCapacity = async (
  busId: string,
  rideId: string | null,
  newStudentsCount: number
): Promise<void> => {
  // جلب سعة الباص
  const [bus] = await db
    .select({ maxSeats: buses.maxSeats })
    .from(buses)
    .where(eq(buses.id, busId))
    .limit(1);

  if (!bus) {
    throw new NotFound("Bus not found");
  }

  // عد الطلاب الحاليين في الـ Ride (لو موجود)
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
      `Bus capacity exceeded. Max: ${bus.maxSeats}, Current: ${currentStudentsCount}, Trying to add: ${newStudentsCount}, Total would be: ${totalStudents}`
    );
  }
};

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
    students: rideStudentsData,
  } = req.body;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  // Check bus exists
  const bus = await db
    .select()
    .from(buses)
    .where(and(eq(buses.id, busId), eq(buses.organizationId, organizationId)))
    .limit(1);
  if (!bus[0]) throw new NotFound("Bus not found");

  // ✅ التحقق من سعة الباص
  await checkBusCapacity(busId, null, rideStudentsData.length);

  // Check driver exists
  const driver = await db
    .select()
    .from(drivers)
    .where(and(eq(drivers.id, driverId), eq(drivers.organizationId, organizationId)))
    .limit(1);
  if (!driver[0]) throw new NotFound("Driver not found");

  // Check codriver if provided
  if (codriverId) {
    const codriver = await db
      .select()
      .from(codrivers)
      .where(and(eq(codrivers.id, codriverId), eq(codrivers.organizationId, organizationId)))
      .limit(1);
    if (!codriver[0]) throw new NotFound("Codriver not found");
  }

  // Check route exists
  const route = await db
    .select()
    .from(Rout)
    .where(and(eq(Rout.id, routeId), eq(Rout.organizationId, organizationId)))
    .limit(1);
  if (!route[0]) throw new NotFound("Route not found");

  // Get route pickup points
  const routePickupPointsList = await db
    .select()
    .from(routePickupPoints)
    .where(eq(routePickupPoints.routeId, routeId));
  const validPickupPointIds = routePickupPointsList.map((p) => p.pickupPointId);

  // Validate students and pickup points
  const studentIds = rideStudentsData.map((s: any) => s.studentId);
  
  // تحقق من عدم تكرار الطلاب
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
    repeatType: repeatType || null,
    startDate,
    endDate: endDate || null,
  });

  const rideStudentsInsert = rideStudentsData.map((s: any) => ({
    id: uuidv4(),
    rideId,
    studentId: s.studentId,
    pickupPointId: s.pickupPointId,
    pickupTime: s.pickupTime || null,
  }));

  await db.insert(rideStudents).values(rideStudentsInsert);

  SuccessResponse(
    res,
    {
      message: "Ride created successfully",
      rideId,
      studentsCount: rideStudentsData.length,
      busCapacity: bus[0].maxSeats,
    },
    201
  );
};


// ✅ Get All Rides
export const getAllRides = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  // جلب كل الرحلات
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
      status: rides.status,
      startedAt: rides.startedAt,
      completedAt: rides.completedAt,
      createdAt: rides.createdAt,
      // Bus
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      // Driver
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      // Codriver
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      // Route
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rides)
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(eq(rides.organizationId, organizationId))
    .orderBy(sql`${rides.startDate} DESC`);

  // جلب عدد الطلاب لكل رحلة
  const rideIds = allRides.map((r) => r.id);
  
  let studentsCountMap: Record<string, any> = {};
  
  if (rideIds.length > 0) {
    const studentsCounts = await db
      .select({
        rideId: rideStudents.rideId,
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
        pickedUp: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
        droppedOff: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
        absent: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
        excused: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
      })
      .from(rideStudents)
      .where(inArray(rideStudents.rideId, rideIds))
      .groupBy(rideStudents.rideId);

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
    }, {} as Record<string, any>);
  }

  // تاريخ اليوم
  const today = new Date().toISOString().split("T")[0];

  // Format ride function
  const formatRide = (ride: any) => {
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
  const upcoming: any[] = [];   // الرحلات القادمة
  const current: any[] = [];    // الرحلات الحالية (اليوم + in_progress)
  const past: any[] = [];       // الرحلات السابقة

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

  return SuccessResponse(res, {
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
// ✅ Get Ride By ID - Full Details
export const getRideById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  // 1) جلب بيانات الرحلة الأساسية
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
      status: rides.status,
      startedAt: rides.startedAt,
      completedAt: rides.completedAt,
      currentLat: rides.currentLat,
      currentLng: rides.currentLng,
      createdAt: rides.createdAt,
      // Bus
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      // Driver
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      // Codriver
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      codriverPhone: codrivers.phone,
      // Route
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

  // 2) جلب كل الطلاب في الرحلة
  const allStudents = await db
    .select({
      id: rideStudents.id,
      pickupTime: rideStudents.pickupTime,
      status: rideStudents.status,
      excuseReason: rideStudents.excuseReason,
      pickedUpAt: rideStudents.pickedUpAt,
      droppedOffAt: rideStudents.droppedOffAt,
      // Student
      studentId: students.id,
      studentName: students.name,
      studentAvatar: students.avatar,
      studentGrade: students.grade,
      studentClassroom: students.classroom,
      // Parent
      parentId: parents.id,
      parentName: parents.name,
      parentPhone: parents.phone,
      // Pickup Point
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
      stopOrder: routePickupPoints.stopOrder,
    })
    .from(rideStudents)
    .leftJoin(students, eq(rideStudents.studentId, students.id))
    .leftJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(pickupPoints, eq(rideStudents.pickupPointId, pickupPoints.id))
    .leftJoin(
      routePickupPoints,
      and(
        eq(routePickupPoints.pickupPointId, rideStudents.pickupPointId),
        eq(routePickupPoints.routeId, rideData.routeId!)
      )
    )
    .where(eq(rideStudents.rideId, id))
    .orderBy(routePickupPoints.stopOrder);

  // 3) تصنيف الطلاب حسب الحالة
  const formatStudent = (s: any) => ({
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

  let ridePhase: "upcoming" | "today" | "in_progress" | "completed" | "cancelled" | "past";
  
  if (rideData.status === "cancelled") {
    ridePhase = "cancelled";
  } else if (rideData.status === "completed") {
    ridePhase = "completed";
  } else if (rideData.status === "in_progress") {
    ridePhase = "in_progress";
  } else if (rideDate && rideDate > today) {
    ridePhase = "upcoming";
  } else if (rideDate && rideDate === today) {
    ridePhase = "today";
  } else {
    ridePhase = "past";
  }

  // 6) جلب نقاط المسار بالترتيب
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
      currentLocation:
        rideData.currentLat && rideData.currentLng
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
      pending,      // في انتظار الصعود
      pickedUp,     // تم استلامهم (في الباص)
      droppedOff,   // تم توصيلهم
      absent,       // غائبين
      excused,      // معذورين
    },
  };

  return SuccessResponse(res, response, 200);
};

// ✅ Update Ride
export const updateRide = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { busId, driverId, codriverId, routeId, name, rideType, frequency, repeatType, startDate, endDate, isActive, status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingRide = await db.select().from(rides).where(and(eq(rides.id, id), eq(rides.organizationId, organizationId))).limit(1);
    if (!existingRide[0]) throw new NotFound("Ride not found");

    if (busId) {
        const bus = await db.select().from(buses).where(and(eq(buses.id, busId), eq(buses.organizationId, organizationId))).limit(1);
        if (!bus[0]) throw new NotFound("Bus not found");
    }

    if (driverId) {
        const driver = await db.select().from(drivers).where(and(eq(drivers.id, driverId), eq(drivers.organizationId, organizationId))).limit(1);
        if (!driver[0]) throw new NotFound("Driver not found");
    }

    if (codriverId) {
        const codriver = await db.select().from(codrivers).where(and(eq(codrivers.id, codriverId), eq(codrivers.organizationId, organizationId))).limit(1);
        if (!codriver[0]) throw new NotFound("Codriver not found");
    }

    if (routeId) {
        const route = await db.select().from(Rout).where(and(eq(Rout.id, routeId), eq(Rout.organizationId, organizationId))).limit(1);
        if (!route[0]) throw new NotFound("Route not found");
    }

    await db.update(rides).set({
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
    }).where(eq(rides.id, id));

    SuccessResponse(res, { message: "Ride updated successfully" }, 200);
};

// ✅ Delete Ride
export const deleteRide = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const existingRide = await db.select().from(rides).where(and(eq(rides.id, id), eq(rides.organizationId, organizationId))).limit(1);
    if (!existingRide[0]) throw new NotFound("Ride not found");

    await db.delete(rideStudents).where(eq(rideStudents.rideId, id));
    await db.delete(rides).where(eq(rides.id, id));

    SuccessResponse(res, { message: "Ride deleted successfully" }, 200);
};

// ✅ Add Students to Ride
export const addStudentsToRide = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { students: newStudents } = req.body;
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

  // ✅ التحقق من سعة الباص
  await checkBusCapacity(existingRide[0].busId, id, newStudents.length);

  // Get route pickup points
  const routePickupPointsList = await db
    .select()
    .from(routePickupPoints)
    .where(eq(routePickupPoints.routeId, existingRide[0].routeId));
  const validPickupPointIds = routePickupPointsList.map((p) => p.pickupPointId);

  // Validate students
  const studentIds = newStudents.map((s: any) => s.studentId);
  
  // تحقق من عدم تكرار الطلاب
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

  // Check if students already in ride
  const alreadyInRide = await db
    .select()
    .from(rideStudents)
    .where(and(eq(rideStudents.rideId, id), inArray(rideStudents.studentId, studentIds)));
  if (alreadyInRide.length > 0) {
    throw new BadRequest("One or more students already in this ride");
  }

  for (const s of newStudents) {
    if (!validPickupPointIds.includes(s.pickupPointId)) {
      throw new BadRequest(`Pickup point ${s.pickupPointId} not found in this route`);
    }
  }

  const rideStudentsInsert = newStudents.map((s: any) => ({
    id: uuidv4(),
    rideId: id,
    studentId: s.studentId,
    pickupPointId: s.pickupPointId,
    pickupTime: s.pickupTime || null,
  }));

  await db.insert(rideStudents).values(rideStudentsInsert);

  // جلب العدد الحالي
  const [currentCount] = await db
    .select({ count: count() })
    .from(rideStudents)
    .where(eq(rideStudents.rideId, id));

  const [bus] = await db
    .select({ maxSeats: buses.maxSeats })
    .from(buses)
    .where(eq(buses.id, existingRide[0].busId))
    .limit(1);

  SuccessResponse(
    res,
    {
      message: "Students added to ride successfully",
      studentsAdded: newStudents.length,
      totalStudents: currentCount.count,
      busCapacity: bus.maxSeats,
      remainingSeats: bus.maxSeats - currentCount.count,
    },
    201
  );
};



// ✅ Remove Student from Ride
export const removeStudentFromRide = async (req: Request, res: Response) => {
  const { id, studentId } = req.params;
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

  const existingRideStudent = await db
    .select()
    .from(rideStudents)
    .where(and(eq(rideStudents.rideId, id), eq(rideStudents.studentId, studentId)))
    .limit(1);
  if (!existingRideStudent[0]) throw new NotFound("Student not found in this ride");

  await db.delete(rideStudents).where(eq(rideStudents.id, existingRideStudent[0].id));

  // جلب العدد المتبقي
  const [currentCount] = await db
    .select({ count: count() })
    .from(rideStudents)
    .where(eq(rideStudents.rideId, id));

  SuccessResponse(
    res,
    {
      message: "Student removed from ride successfully",
      remainingStudents: currentCount.count,
    },
    200
  );
};


// ✅ Search Students by Parent Phone (for adding to ride)
export const searchStudentsForRide = async (req: Request, res: Response) => {
  const { phone, name, parentName } = req.query;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!phone && !name && !parentName) {
    throw new BadRequest("Please provide phone, student name, or parent name to search");
  }

  let conditions: any[] = [eq(students.organizationId, organizationId)];

  // البحث برقم تليفون ولي الأمر
  if (phone) {
    conditions.push(sql`${parents.phone} LIKE ${`%${phone}%`}`);
  }

  // البحث باسم الطالب
  if (name) {
    conditions.push(sql`${students.name} LIKE ${`%${name}%`}`);
  }

  // البحث باسم ولي الأمر
  if (parentName) {
    conditions.push(sql`${parents.name} LIKE ${`%${parentName}%`}`);
  }

  const searchResults = await db
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
        avatar: parents.avatar,
      },
    })
    .from(students)
    .leftJoin(parents, eq(students.parentId, parents.id))
    .where(and(...conditions))
    .limit(20);

  SuccessResponse(
    res,
    {
      students: searchResults,
      count: searchResults.length,
    },
    200
  );
};


export const selection =async(req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const allroutswithpickuppoints = await db
    .select()
    .from(Rout)
    .where(eq(Rout.organizationId, organizationId));
  const routesWithPickupPoints = await Promise.all(
    allroutswithpickuppoints.map(async (route) => {
      const points = await db
        .select({
          id: routePickupPoints.id,
          stopOrder: routePickupPoints.stopOrder,
          pickupPoint: {
            id: pickupPoints.id,
            name: pickupPoints.name,
            address: pickupPoints.address,
            lat: pickupPoints.lat,
            lng: pickupPoints.lng,
          },
        })
        .from(routePickupPoints)
        .leftJoin(pickupPoints, eq(routePickupPoints.pickupPointId, pickupPoints.id))
        .where(eq(routePickupPoints.routeId, route.id));
      return { ...route, pickupPoints: points };
    })
  );
  
  const allbuses = await db
    .select()
    .from(buses)
    .where(eq(buses.organizationId, organizationId));
  const alldrivers = await db
    .select()
    .from(drivers)
    .where(eq(drivers.organizationId, organizationId));
    
   const allcodrivers = await db
    .select()
    .from(codrivers)
    .where(eq(codrivers.organizationId, organizationId));

    const allstudents = await db
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
        avatar: parents.avatar,
      },
    })
    .from(students)
    .leftJoin(parents, eq(students.parentId, parents.id))
    .where(eq(students.organizationId, organizationId));

    const getallparent= await db
    .select()
    .from(parents)
    .where(eq(parents.organizationId, organizationId));

  SuccessResponse(res, {
    routes: routesWithPickupPoints,
    buses: allbuses,
    drivers: alldrivers,
    codrivers: allcodrivers,
    students: allstudents,
    parents:getallparent
  }, 200);
 }


 // ✅ Get Rides By Date
export const getRidesByDate = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;
  const { date } = req.body; // YYYY-MM-DD

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  if (!date) {
    throw new BadRequest("Date is required");
  }

  // جلب رحلات التاريخ المحدد
  const dayRides = await db
    .select({
      id: rides.id,
      name: rides.name,
      rideType: rides.rideType,
      frequency: rides.frequency,
      startDate: rides.startDate,
      endDate: rides.endDate,
      isActive: rides.isActive,
      status: rides.status,
      startedAt: rides.startedAt,
      completedAt: rides.completedAt,
      createdAt: rides.createdAt,
      // Bus
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      // Driver
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      // Codriver
      codriverId: codrivers.id,
      codriverName: codrivers.name,
      codriverPhone: codrivers.phone,
      // Route
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rides)
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(codrivers, eq(rides.codriverId, codrivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rides.organizationId, organizationId),
        sql`${rides.startDate} = ${date}`
      )
    )
    .orderBy(rides.rideType, rides.createdAt);

  // جلب عدد الطلاب لكل رحلة
  const rideIds = dayRides.map((r) => r.id);
  
  let studentsCountMap: Record<string, any> = {};
  
  if (rideIds.length > 0) {
    const studentsCounts = await db
      .select({
        rideId: rideStudents.rideId,
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'pending' THEN 1 ELSE 0 END)`,
        pickedUp: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'picked_up' THEN 1 ELSE 0 END)`,
        droppedOff: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'dropped_off' THEN 1 ELSE 0 END)`,
        absent: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'absent' THEN 1 ELSE 0 END)`,
        excused: sql<number>`SUM(CASE WHEN ${rideStudents.status} = 'excused' THEN 1 ELSE 0 END)`,
      })
      .from(rideStudents)
      .where(inArray(rideStudents.rideId, rideIds))
      .groupBy(rideStudents.rideId);

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
    }, {} as Record<string, any>);
  }

  // Format ride
  const formatRide = (ride: any) => {
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
  const totalStudents = Object.values(studentsCountMap).reduce((sum: number, s: any) => sum + s.total, 0);
  const totalPickedUp = Object.values(studentsCountMap).reduce((sum: number, s: any) => sum + s.pickedUp + s.droppedOff, 0);
  const totalAbsent = Object.values(studentsCountMap).reduce((sum: number, s: any) => sum + s.absent + s.excused, 0);

  return SuccessResponse(res, {
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
