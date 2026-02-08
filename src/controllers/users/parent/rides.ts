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

  const myChildren = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
      code: students.code,
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

  const today = new Date().toISOString().split("T")[0]; // ✅

  if (myChildren.length === 0) {
    return SuccessResponse(
      res,
      {
        date: today,
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

  const todayRides = await db
    .select({
      studentId: rideOccurrenceStudents.studentId,
      studentStatus: rideOccurrenceStudents.status,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      pickupTime: rideOccurrenceStudents.pickupTime,
      excuseReason: rideOccurrenceStudents.excuseReason,
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
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
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
        sql`DATE(${rideOccurrences.occurDate}) = ${today}` // ✅
      )
    )
    .orderBy(rides.rideType);

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
      date: today, // ✅
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

  const today = new Date().toISOString().split("T")[0]; // ✅

  let dateCondition;
  let orderDirection: any = desc(rideOccurrences.occurDate);

  switch (type) {
    case "today":
      // ✅ النهارده بس
      dateCondition = sql`DATE(${rideOccurrences.occurDate}) = ${today}`;
      break;

    case "upcoming":
      // ✅ بعد النهارده (مش شامل النهارده)
      dateCondition = sql`DATE(${rideOccurrences.occurDate}) > ${today}`;
      orderDirection = asc(rideOccurrences.occurDate);
      break;

    case "history":
      // ✅ قبل النهارده (مش شامل النهارده)
      dateCondition = sql`DATE(${rideOccurrences.occurDate}) < ${today}`;
      if (from) {
        dateCondition = and(
          dateCondition,
          sql`DATE(${rideOccurrences.occurDate}) >= ${from}`
        );
      }
      if (to) {
        dateCondition = and(
          dateCondition,
          sql`DATE(${rideOccurrences.occurDate}) <= ${to}`
        );
      }
      break;

    default:
      throw new BadRequest("Invalid type. Use: today, upcoming, or history");
  }

  const offset = (Number(page) - 1) * Number(limit);

  const ridesData = await db
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
      studentOccurrenceId: rideOccurrenceStudents.id,
      studentStatus: rideOccurrenceStudents.status,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      pickupTime: rideOccurrenceStudents.pickupTime,
      excuseReason: rideOccurrenceStudents.excuseReason,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
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

  const formattedRides = ridesData.map((r) => ({
    occurrenceId: r.occurrenceId,
    date: r.occurDate,
    status: r.occurrenceStatus,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    busLocation:
      r.occurrenceStatus === "in_progress"
        ? { lat: r.currentLat, lng: r.currentLng }
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
      ? { id: r.busId, busNumber: r.busNumber, plateNumber: r.plateNumber }
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

  if (type === "today") {
    response = {
      child: response.child,
      type,
      date: today, // ✅
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

  const myChildren = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    throw new NotFound("No children found");
  }

  const childrenIds = myChildren.map((c) => c.id);

  const [occurrence] = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      status: rideOccurrences.status,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(eq(rideOccurrences.id, occurrenceId))
    .limit(1);

  if (!occurrence) {
    throw new NotFound("Ride occurrence not found");
  }

  const childInRide = await db
    .select({ studentId: rideOccurrenceStudents.studentId })
    .from(rideOccurrenceStudents)
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        inArray(rideOccurrenceStudents.studentId, childrenIds)
      )
    )
    .limit(1);

  if (childInRide.length === 0) {
    throw new NotFound("Access denied - no children in this ride");
  }

  const childrenStatus = await db
    .select({
      id: rideOccurrenceStudents.id,
      status: rideOccurrenceStudents.status,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      pickupTime: rideOccurrenceStudents.pickupTime,
      excuseReason: rideOccurrenceStudents.excuseReason,
      childId: students.id,
      childName: students.name,
      childAvatar: students.avatar,
      childGrade: students.grade,
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
      .innerJoin(
        pickupPoints,
        eq(routePickupPoints.pickupPointId, pickupPoints.id)
      )
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
                ? { lat: occurrence.currentLat, lng: occurrence.currentLng }
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

  const [child] = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.parentId, parentId)))
    .limit(1);

  if (!child) {
    throw new NotFound("Child not found");
  }

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

  if (studentOccurrence.occurrenceStatus === "completed") {
    throw new BadRequest("Cannot submit excuse - ride already completed");
  }

  if (studentOccurrence.occurrenceStatus === "cancelled") {
    throw new BadRequest("Cannot submit excuse - ride is cancelled");
  }

  if (studentOccurrence.status !== "pending") {
    throw new BadRequest(
      `Cannot submit excuse - student status is: ${studentOccurrence.status}`
    );
  }

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

// ✅ Get Active Rides (الرحلات الجارية حالياً)
export const getActiveRides = async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  const myChildren = await db
    .select({ id: students.id, name: students.name, avatar: students.avatar })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    return SuccessResponse(res, { activeRides: [], count: 0 }, 200);
  }

  const childrenIds = myChildren.map((c) => c.id);

  const activeRides = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      status: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      studentId: rideOccurrenceStudents.studentId,
      studentStatus: rideOccurrenceStudents.status,
      pickupTime: rideOccurrenceStudents.pickupTime,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverId: drivers.id,
      driverName: drivers.name,
      driverPhone: drivers.phone,
      driverAvatar: drivers.avatar,
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
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
        eq(rideOccurrences.status, "in_progress")
      )
    );

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
            currentLocation: { lat: r.currentLat, lng: r.currentLng },
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

  SuccessResponse(
    res,
    {
      activeRides: formattedRides,
      count: formattedRides.length,
    },
    200
  );
};

// ✅ Get Upcoming Rides (الرحلات القادمة)
export const getUpcomingRides = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { days = 7 } = req.query;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  const myChildren = await db
    .select({ id: students.id, name: students.name, avatar: students.avatar })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    return SuccessResponse(res, { upcomingRides: [], count: 0 }, 200);
  }

  const childrenIds = myChildren.map((c) => c.id);

  const today = new Date().toISOString().split("T")[0]; // ✅
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(days));
  const endDateStr = endDate.toISOString().split("T")[0]; // ✅

  const upcomingRides = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      status: rideOccurrences.status,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      studentId: rideOccurrenceStudents.studentId,
      pickupTime: rideOccurrenceStudents.pickupTime,
      pickupPointName: pickupPoints.name,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(
      rideOccurrences,
      eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id)
    )
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(
      pickupPoints,
      eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id)
    )
    .where(
      and(
        inArray(rideOccurrenceStudents.studentId, childrenIds),
        sql`DATE(${rideOccurrences.occurDate}) > ${today}`, // ✅ بعد النهارده
        sql`DATE(${rideOccurrences.occurDate}) <= ${endDateStr}`, // ✅
        eq(rideOccurrences.status, "scheduled")
      )
    )
    .orderBy(asc(rideOccurrences.occurDate), asc(rides.rideType));

  const groupedByDate = upcomingRides.reduce((acc: any, r) => {
    const dateKey = new Date(r.occurDate).toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        dayName: new Date(r.occurDate).toLocaleDateString("ar-EG", {
          weekday: "long",
        }),
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

  SuccessResponse(
    res,
    {
      upcomingRides: Object.values(groupedByDate),
      totalDays: Object.keys(groupedByDate).length,
      totalRides: upcomingRides.length,
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

  const targetYear = year ? Number(year) : new Date().getFullYear();
  const targetMonth = month ? Number(month) - 1 : new Date().getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

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
        monthName: new Date(targetYear, targetMonth).toLocaleDateString(
          "ar-EG",
          { month: "long" }
        ),
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
              ? { lat: r.currentLat, lng: r.currentLng }
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