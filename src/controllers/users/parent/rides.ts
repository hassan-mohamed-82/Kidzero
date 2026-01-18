// src/controllers/users/parent/rides.ts

import { Request, Response } from "express";
import { db } from "../../../models/db";
import {
  students,
  rides,
  rideStudents,
  rideOccurrences,
  rideOccurrenceStudents,
  buses,
  drivers,
  Rout,
  pickupPoints,
  routePickupPoints,
  organizations,
} from "../../../models/schema";
import { eq, and, sql, inArray, desc, gte, lte, asc } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";

// ✅ Get All Children with Their Rides
export const getMyChildrenRides = async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  // جلب أولاد الـ Parent مع معلومات المدرسة
  const myChildren = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      code: students.code,
      // معلومات المدرسة
      organizationId: students.organizationId,
      organizationName: organizations.name,
      organizationLogo: organizations.logo,
    })
    .from(students)
    .leftJoin(organizations, eq(students.organizationId, organizations.id))
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    return SuccessResponse(
      res,
      {
        children: [],
        byOrganization: [],
        totalChildren: 0,
      },
      200
    );
  }

  const childrenIds = myChildren.map((c) => c.id);

  // جلب الرحلات لكل طفل
  const childrenRides = await db
    .select({
      studentId: rideStudents.studentId,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      frequency: rides.frequency,
      pickupTime: rideStudents.pickupTime,
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
    })
    .from(rideStudents)
    .innerJoin(rides, eq(rideStudents.rideId, rides.id))
    .leftJoin(pickupPoints, eq(rideStudents.pickupPointId, pickupPoints.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .where(
      and(
        inArray(rideStudents.studentId, childrenIds),
        eq(rides.isActive, "on")
      )
    );

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
  const byOrganization = Object.values(
    childrenWithRides.reduce((acc: any, child) => {
      const orgId = child.organization.id;
      if (!acc[orgId]) {
        acc[orgId] = {
          organization: child.organization,
          children: [],
        };
      }
      acc[orgId].children.push(child);
      return acc;
    }, {})
  );

  SuccessResponse(
    res,
    {
      children: childrenWithRides,
      byOrganization,
      totalChildren: childrenWithRides.length,
    },
    200
  );
};

// ✅ Get Today's Rides for All Children
export const getTodayRidesForAllChildren = async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  // جلب أولاد الـ Parent
  const myChildren = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      organizationId: students.organizationId,
      organizationName: organizations.name,
      organizationLogo: organizations.logo,
    })
    .from(students)
    .leftJoin(organizations, eq(students.organizationId, organizations.id))
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    return SuccessResponse(
      res,
      {
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
      },
      200
    );
  }

  const childrenIds = myChildren.map((c) => c.id);

  // جلب رحلات اليوم
  const todayRides = await db
    .select({
      // Student
      studentId: rideOccurrenceStudents.studentId,
      studentStatus: rideOccurrenceStudents.status,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      pickupTime: rideOccurrenceStudents.pickupTime,
      excuseReason: rideOccurrenceStudents.excuseReason,
      // Occurrence
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      // Ride
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      // Bus
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      // Driver
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      // Pickup Point
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(
      rideOccurrences,
      eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id)
    )
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(
      pickupPoints,
      eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id)
    )
    .where(
      and(
        inArray(rideOccurrenceStudents.studentId, childrenIds),
        sql`DATE(${rideOccurrences.occurDate}) = CURDATE()`
      )
    )
    .orderBy(rides.rideType);

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

  SuccessResponse(
    res,
    {
      date: new Date().toISOString().split("T")[0],
      children: childrenWithTodayRides,
      summary,
    },
    200
  );
};

// ✅ Get Child Rides (today / upcoming / history)
export const getChildRides = async (req: Request, res: Response) => {
  const { childId } = req.params;
  const { type = "today", from, to, page = 1, limit = 20 } = req.query;
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  // تحقق إن الطالب ابن الـ Parent
  const [child] = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      organizationId: students.organizationId,
      organizationName: organizations.name,
    })
    .from(students)
    .leftJoin(organizations, eq(students.organizationId, organizations.id))
    .where(and(eq(students.id, childId), eq(students.parentId, parentId)))
    .limit(1);

  if (!child) {
    throw new NotFound("Child not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // بناء الشروط حسب النوع
  let dateCondition;
  let orderDirection: any = desc(rideOccurrences.occurDate);

  switch (type) {
    case "today":
      dateCondition = sql`DATE(${rideOccurrences.occurDate}) = CURDATE()`;
      break;

    case "upcoming":
      dateCondition = gte(rideOccurrences.occurDate, today);
      orderDirection = asc(rideOccurrences.occurDate);
      break;

    case "history":
      dateCondition = lte(rideOccurrences.occurDate, today);
      if (from) {
        dateCondition = and(
          dateCondition,
          gte(rideOccurrences.occurDate, new Date(from as string))
        );
      }
      if (to) {
        dateCondition = and(
          dateCondition,
          lte(rideOccurrences.occurDate, new Date(to as string))
        );
      }
      break;

    default:
      throw new BadRequest("Invalid type. Use: today, upcoming, or history");
  }

  const offset = (Number(page) - 1) * Number(limit);

  // جلب الرحلات
  const ridesData = await db
    .select({
      // Occurrence
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      // Ride
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      // Student Status
      studentOccurrenceId: rideOccurrenceStudents.id,
      studentStatus: rideOccurrenceStudents.status,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      pickupTime: rideOccurrenceStudents.pickupTime,
      excuseReason: rideOccurrenceStudents.excuseReason,
      // Bus
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      // Driver
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      // Pickup Point
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(
      rideOccurrences,
      eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id)
    )
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(
      pickupPoints,
      eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id)
    )
    .where(and(eq(rideOccurrenceStudents.studentId, childId), dateCondition))
    .orderBy(orderDirection, rides.rideType)
    .limit(Number(limit))
    .offset(offset);

  // تنسيق البيانات
  const formattedRides = ridesData.map((r) => ({
    occurrenceId: r.occurrenceId,
    date: r.occurDate,
    status: r.occurrenceStatus,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    busLocation:
      r.occurrenceStatus === "in_progress"
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
  let response: any = {
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

  SuccessResponse(res, response, 200);
};

// ✅ Get Live Tracking for a Ride
export const getLiveTracking = async (req: Request, res: Response) => {
  const { occurrenceId } = req.params;
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  // جلب أولاد الـ Parent
  const myChildren = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    throw new NotFound("No children found");
  }

  const childrenIds = myChildren.map((c) => c.id);

  // تحقق إن الـ Parent عنده طفل في هذه الرحلة
  const [occurrence] = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      status: rideOccurrences.status,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      // Ride
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      // Bus
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      // Driver
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      // Route
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .innerJoin(
      rideOccurrenceStudents,
      eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id)
    )
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        inArray(rideOccurrenceStudents.studentId, childrenIds)
      )
    )
    .limit(1);

  if (!occurrence) {
    throw new NotFound("Ride not found or access denied");
  }

  // جلب حالة أطفال الـ Parent في هذه الرحلة
  const childrenStatus = await db
    .select({
      id: rideOccurrenceStudents.id,
      status: rideOccurrenceStudents.status,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      pickupTime: rideOccurrenceStudents.pickupTime,
      excuseReason: rideOccurrenceStudents.excuseReason,
      // Child
      childId: students.id,
      childName: students.name,
      childAvatar: students.avatar,
      childGrade: students.grade,
      // Pickup Point
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(students, eq(rideOccurrenceStudents.studentId, students.id))
    .leftJoin(
      pickupPoints,
      eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id)
    )
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        inArray(rideOccurrenceStudents.studentId, childrenIds)
      )
    );

  // جلب نقاط المسار لو موجود
  let routeStops: any[] = [];
  if (occurrence.routeId) {
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
      .innerJoin(pickupPoints, eq(routePickupPoints.pickupPointId, pickupPoints.id))
      .where(eq(routePickupPoints.routeId, occurrence.routeId))
      .orderBy(asc(routePickupPoints.stopOrder));
  }

  SuccessResponse(
    res,
    {
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
          currentLocation:
            occurrence.status === "in_progress"
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
    },
    200
  );
};

// ✅ Submit Excuse for Child (عذر غياب)
export const submitExcuse = async (req: Request, res: Response) => {
  const { occurrenceId, studentId } = req.params;
  const { reason } = req.body;
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  if (!reason || reason.trim() === "") {
    throw new BadRequest("Excuse reason is required");
  }

  // تحقق إن الطالب ابن الـ Parent
  const [child] = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.parentId, parentId)))
    .limit(1);

  if (!child) {
    throw new NotFound("Child not found");
  }

  // تحقق من وجود الطالب في الرحلة
  const [studentOccurrence] = await db
    .select({
      id: rideOccurrenceStudents.id,
      status: rideOccurrenceStudents.status,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(
      rideOccurrences,
      eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id)
    )
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        eq(rideOccurrenceStudents.studentId, studentId)
      )
    )
    .limit(1);

  if (!studentOccurrence) {
    throw new NotFound("Student not in this ride");
  }

  // تحقق من حالة الرحلة
  if (studentOccurrence.occurrenceStatus === "completed") {
    throw new BadRequest("Cannot submit excuse - ride already completed");
  }

  if (studentOccurrence.occurrenceStatus === "cancelled") {
    throw new BadRequest("Cannot submit excuse - ride is cancelled");
  }

  // تحقق من حالة الطالب
  if (studentOccurrence.status !== "pending") {
    throw new BadRequest(
      `Cannot submit excuse - student status is: ${studentOccurrence.status}`
    );
  }

  // تحديث حالة الطالب
  await db
    .update(rideOccurrenceStudents)
    .set({
      status: "excused",
      excuseReason: reason.trim(),
    })
    .where(eq(rideOccurrenceStudents.id, studentOccurrence.id));

  SuccessResponse(
    res,
    {
      message: "تم تقديم العذر بنجاح",
      excuse: {
        childId: child.id,
        childName: child.name,
        occurrenceId,
        reason: reason.trim(),
        status: "excused",
      },
    },
    200
  );
};


// ✅ Get Ride History Summary (ملخص سجل الرحلات)
export const getRideHistorySummary = async (req: Request, res: Response) => {
  const { childId } = req.params;
  const { month, year } = req.query;
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  // تحقق إن الطالب ابن الـ Parent
  const [child] = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      organizationName: organizations.name,
    })
    .from(students)
    .leftJoin(organizations, eq(students.organizationId, organizations.id))
    .where(and(eq(students.id, childId), eq(students.parentId, parentId)))
    .limit(1);

  if (!child) {
    throw new NotFound("Child not found");
  }

  // تحديد الفترة
  const targetYear = year ? Number(year) : new Date().getFullYear();
  const targetMonth = month ? Number(month) - 1 : new Date().getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  // جلب الإحصائيات
  const ridesData = await db
    .select({
      status: rideOccurrenceStudents.status,
      rideType: rides.rideType,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(
      rideOccurrences,
      eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id)
    )
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrenceStudents.studentId, childId),
        gte(rideOccurrences.occurDate, startDate),
        lte(rideOccurrences.occurDate, endDate)
      )
    );

  const summary = {
    total: ridesData.length,
    morning: ridesData.filter((r) => r.rideType === "morning").length,
    afternoon: ridesData.filter((r) => r.rideType === "afternoon").length,
    byStatus: {
      completed: ridesData.filter(
        (r) => r.status === "picked_up" || r.status === "dropped_off"
      ).length,
      absent: ridesData.filter((r) => r.status === "absent").length,
      excused: ridesData.filter((r) => r.status === "excused").length,
      pending: ridesData.filter((r) => r.status === "pending").length,
    },
    attendanceRate:
      ridesData.length > 0
        ? Math.round(
          ((ridesData.filter(
            (r) => r.status === "picked_up" || r.status === "dropped_off"
          ).length /
            ridesData.length) *
            100)
        )
        : 0,
  };

  SuccessResponse(
    res,
    {
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
    },
    200
  );
};

// ============ Helper Functions ============

function formatTodayRide(r: any) {
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
        location:
          r.occurrenceStatus === "in_progress"
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
