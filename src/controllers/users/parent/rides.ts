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
} from "../../../models/schema";
import { eq, and, sql, inArray, desc, gte, lte ,asc} from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";

export const getMyChildrenRides = async (req: Request, res: Response) => {
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
      classroom: students.classroom,
    })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    return SuccessResponse(res, { children: [] }, 200);
  }

  const childrenIds = myChildren.map((c) => c.id);

  // جلب الرحلات لكل طفل
  const childrenRides = await db
    .select({
      studentId: rideStudents.studentId,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      pickupTime: rideStudents.pickupTime,
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
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

  // تجميع البيانات
  const childrenWithRides = myChildren.map((child) => ({
    ...child,
    rides: childrenRides
      .filter((r) => r.studentId === child.id)
      .map((r) => ({
        id: r.rideId,
        name: r.rideName,
        type: r.rideType,
        pickupTime: r.pickupTime,
        pickupPoint: {
          id: r.pickupPointId,
          name: r.pickupPointName,
          lat: r.pickupPointLat,
          lng: r.pickupPointLng,
        },
        bus: {
          id: r.busId,
          busNumber: r.busNumber,
          plateNumber: r.plateNumber,
        },
        driver: {
          id: r.driverId,
          name: r.driverName,
          phone: r.driverPhone,
          avatar: r.driverAvatar,
        },
      })),
  }));

  SuccessResponse(res, { children: childrenWithRides }, 200);
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
  const child = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
    })
    .from(students)
    .where(and(eq(students.id, childId), eq(students.parentId, parentId)))
    .limit(1);

  if (!child[0]) {
    throw new NotFound("Child not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // بناء الشروط حسب النوع
  let dateCondition;
  let orderDirection = desc(rideOccurrences.occurDate);

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
      // إضافة فلترة بالتاريخ إذا موجودة
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
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(rideOccurrences, eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id))
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .leftJoin(pickupPoints, eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id))
    .where(
      and(
        eq(rideOccurrenceStudents.studentId, childId),
        dateCondition
      )
    )
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
    busLocation: r.occurrenceStatus === "in_progress" ? {
      lat: r.currentLat,
      lng: r.currentLng,
    } : null,
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
    bus: {
      id: r.busId,
      busNumber: r.busNumber,
      plateNumber: r.plateNumber,
    },
    driver: {
      id: r.driverId,
      name: r.driverName,
      phone: r.driverPhone,
      avatar: r.driverAvatar,
    },
    pickupPoint: {
      id: r.pickupPointId,
      name: r.pickupPointName,
      lat: r.pickupPointLat,
      lng: r.pickupPointLng,
    },
  }));

  // تقسيم حسب النوع (للـ today فقط)
  let response: any = {
    child: child[0],
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
      child: child[0],
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

  // تحقق إن الـ Parent عنده طفل في هذه الرحلة
  const myChildren = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    throw new NotFound("No children found");
  }

  const childrenIds = myChildren.map((c) => c.id);

  const occurrence = await db
    .select({
      occurrenceId: rideOccurrences.id,
      status: rideOccurrences.status,
      currentLat: rideOccurrences.currentLat,
      currentLng: rideOccurrences.currentLng,
      startedAt: rideOccurrences.startedAt,
      rideName: rides.name,
      rideType: rides.rideType,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      driverName: drivers.name,
      driverPhone: drivers.phone,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(drivers, eq(rides.driverId, drivers.id))
    .innerJoin(rideOccurrenceStudents, eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        inArray(rideOccurrenceStudents.studentId, childrenIds)
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Ride not found or access denied");
  }

  // جلب حالة أطفال الـ Parent في هذه الرحلة
  const childrenStatus = await db
    .select({
      id: rideOccurrenceStudents.id,
      status: rideOccurrenceStudents.status,
      pickedUpAt: rideOccurrenceStudents.pickedUpAt,
      droppedOffAt: rideOccurrenceStudents.droppedOffAt,
      childId: students.id,
      childName: students.name,
      childAvatar: students.avatar,
      pickupPointName: pickupPoints.name,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(students, eq(rideOccurrenceStudents.studentId, students.id))
    .leftJoin(pickupPoints, eq(rideOccurrenceStudents.pickupPointId, pickupPoints.id))
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        inArray(rideOccurrenceStudents.studentId, childrenIds)
      )
    );

  const occ = occurrence[0];

  SuccessResponse(res, {
    ride: {
      id: occ.occurrenceId,
      name: occ.rideName,
      type: occ.rideType,
      status: occ.status,
      startedAt: occ.startedAt,
    },
    bus: {
      busNumber: occ.busNumber,
      plateNumber: occ.plateNumber,
      currentLocation: occ.status === "in_progress" ? {
        lat: occ.currentLat,
        lng: occ.currentLng,
      } : null,
    },
    driver: {
      name: occ.driverName,
      phone: occ.driverPhone,
    },
    children: childrenStatus.map((c) => ({
      id: c.id,
      status: c.status,
      pickedUpAt: c.pickedUpAt,
      droppedOffAt: c.droppedOffAt,
      child: {
        id: c.childId,
        name: c.childName,
        avatar: c.childAvatar,
      },
      pickupPoint: {
        name: c.pickupPointName,
        lat: c.pickupPointLat,
        lng: c.pickupPointLng,
      },
    })),
  }, 200);
};

// ✅ Submit Excuse for Child (عذر غياب)
export const submitExcuse = async (req: Request, res: Response) => {
  const { occurrenceId, studentId } = req.params;
  const { reason } = req.body;
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  if (!reason) {
    throw new BadRequest("Excuse reason is required");
  }

  // تحقق إن الطالب ابن الـ Parent
  const child = await db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.parentId, parentId)))
    .limit(1);

  if (!child[0]) {
    throw new NotFound("Child not found");
  }

  // تحقق من وجود الطالب في الرحلة
  const studentOccurrence = await db
    .select()
    .from(rideOccurrenceStudents)
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        eq(rideOccurrenceStudents.studentId, studentId)
      )
    )
    .limit(1);

  if (!studentOccurrence[0]) {
    throw new NotFound("Student not in this ride");
  }

  if (studentOccurrence[0].status !== "pending") {
    throw new BadRequest("Cannot submit excuse - student already processed");
  }

  // تحديث حالة الطالب
  await db.update(rideOccurrenceStudents).set({
    status: "excused",
    excuseReason: reason,
  }).where(eq(rideOccurrenceStudents.id, studentOccurrence[0].id));

  SuccessResponse(res, { message: "Excuse submitted successfully" }, 200);
};


// ✅ Helper Function
function formatRideResponse(r: any) {
  return {
    occurrenceId: r.occurrenceId,
    date: r.occurDate,
    status: r.occurrenceStatus,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    busLocation: r.occurrenceStatus === "in_progress" ? {
      lat: r.currentLat,
      lng: r.currentLng,
    } : null,
    ride: {
      id: r.rideId,
      name: r.rideName,
      type: r.rideType,
    },
    child: {
      id: r.childId,
      name: r.childName,
      avatar: r.childAvatar,
      status: r.studentStatus,
      pickedUpAt: r.pickedUpAt,
      droppedOffAt: r.droppedOffAt,
      pickupTime: r.pickupTime,
      excuseReason: r.excuseReason,
    },
    pickupPoint: {
      id: r.pickupPointId,
      name: r.pickupPointName,
      lat: r.pickupPointLat,
      lng: r.pickupPointLng,
    },
    bus: {
      id: r.busId,
      busNumber: r.busNumber,
      plateNumber: r.plateNumber,
    },
    driver: {
      id: r.driverId,
      name: r.driverName,
      phone: r.driverPhone,
    },
  };
}