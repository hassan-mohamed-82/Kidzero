// src/controllers/users/driver/ride.ts
import { Request, Response } from "express";
import { db } from "../../../models/db";
import {
  rides,
  rideOccurrences,
  rideOccurrenceStudents,
  buses,
  Rout,
  routePickupPoints,
  students,
  pickupPoints,
  parents,
  notifications,
} from "../../../models/schema";
import { eq, and, sql, inArray, asc,or,count,desc } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";
import { sendPushNotification } from "../../../utils/firebase";

// ✅ Get Driver's Today Rides
export const getMyTodayRides = async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const organizationId = req.user?.organizationId;

  if (!driverId || !organizationId) {
    throw new BadRequest("Driver authentication required");
  }

  const today = new Date().toISOString().split("T")[0];

  const todayOccurrences = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rides.driverId, driverId),
        eq(rides.organizationId, organizationId),
        eq(rides.isActive, "on"),
        sql`DATE(${rideOccurrences.occurDate}) = ${today}`
      )
    )
    .orderBy(rides.rideType);

  const occurrenceIds = todayOccurrences.map((o) => o.occurrenceId);
  let studentsCountMap: Record<string, number> = {};

  if (occurrenceIds.length > 0) {
    const counts = await db
      .select({
        occurrenceId: rideOccurrenceStudents.occurrenceId,
        count: sql<number>`COUNT(*)`,
      })
      .from(rideOccurrenceStudents)
      .where(inArray(rideOccurrenceStudents.occurrenceId, occurrenceIds))
      .groupBy(rideOccurrenceStudents.occurrenceId);

    studentsCountMap = counts.reduce((acc, item) => {
      acc[item.occurrenceId] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);
  }

  const mapOccurrence = (o: typeof todayOccurrences[0]) => ({
    occurrenceId: o.occurrenceId,
    rideId: o.rideId,
    name: o.rideName,
    type: o.rideType,
    status: o.occurrenceStatus,
    startedAt: o.startedAt,
    completedAt: o.completedAt,
    bus: { id: o.busId, busNumber: o.busNumber, plateNumber: o.plateNumber },
    route: { id: o.routeId, name: o.routeName },
    studentsCount: studentsCountMap[o.occurrenceId] || 0,
  });

  const morning = todayOccurrences.filter((o) => o.rideType === "morning").map(mapOccurrence);
  const afternoon = todayOccurrences.filter((o) => o.rideType === "afternoon").map(mapOccurrence);

  SuccessResponse(res, {
    date: today,
    morning,
    afternoon,
    total: todayOccurrences.length,
  }, 200);
};

// ✅ Get Occurrence Details (for Driver)
export const getOccurrenceForDriver = async (req: Request, res: Response) => {
  const { occurrenceId } = req.params;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new BadRequest("Driver authentication required");
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
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.driverId, driverId)
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Occurrence not found");
  }

  const occ = occurrence[0];
  const routeIdValue = occ.routeId;

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
      parentId: parents.id,
      parentName: parents.name,
      parentPhone: parents.phone,
      pickupPointId: pickupPoints.id,
      pickupPointName: pickupPoints.name,
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
        routeIdValue ? eq(routePickupPoints.routeId, routeIdValue) : sql`1=1`
      )
    )
    .where(eq(rideOccurrenceStudents.occurrenceId, occurrenceId))
    .orderBy(asc(routePickupPoints.stopOrder));

  let routeStops: any[] = [];
  if (routeIdValue) {
    routeStops = await db
      .select({
        id: pickupPoints.id,
        name: pickupPoints.name,
        lat: pickupPoints.lat,
        lng: pickupPoints.lng,
        stopOrder: routePickupPoints.stopOrder,
      })
      .from(routePickupPoints)
      .innerJoin(pickupPoints, eq(pickupPoints.id, routePickupPoints.pickupPointId))
      .where(eq(routePickupPoints.routeId, routeIdValue))
      .orderBy(asc(routePickupPoints.stopOrder));

    routeStops = routeStops.map((stop) => ({
      ...stop,
      students: occStudents
        .filter((s) => s.pickupPointId === stop.id)
        .map((s) => ({
          id: s.id,
          status: s.status,
          student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
          parent: { id: s.parentId, name: s.parentName, phone: s.parentPhone },
        })),
    }));
  }

  const stats = {
    total: occStudents.length,
    pending: occStudents.filter((s) => s.status === "pending").length,
    pickedUp: occStudents.filter((s) => s.status === "picked_up").length,
    droppedOff: occStudents.filter((s) => s.status === "dropped_off").length,
    absent: occStudents.filter((s) => s.status === "absent").length,
    excused: occStudents.filter((s) => s.status === "excused").length,
  };

  SuccessResponse(res, {
    occurrence: {
      id: occ.occurrenceId,
      date: occ.occurDate,
      status: occ.occurrenceStatus,
      startedAt: occ.startedAt,
      completedAt: occ.completedAt,
    },
    ride: { id: occ.rideId, name: occ.rideName, type: occ.rideType },
    bus: { id: occ.busId, busNumber: occ.busNumber, plateNumber: occ.plateNumber },
    route: { id: occ.routeId, name: occ.routeName, stops: routeStops },
    stats,
    students: occStudents.map((s) => ({
      id: s.id,
      status: s.status,
      pickupTime: s.pickupTime,
      pickedUpAt: s.pickedUpAt,
      droppedOffAt: s.droppedOffAt,
      excuseReason: s.excuseReason,
      student: { id: s.studentId, name: s.studentName, avatar: s.studentAvatar },
      parent: { id: s.parentId, name: s.parentName, phone: s.parentPhone },
      pickupPoint: {
        id: s.pickupPointId,
        name: s.pickupPointName,
        lat: s.pickupPointLat,
        lng: s.pickupPointLng,
        stopOrder: s.stopOrder,
      },
    })),
  }, 200);
};

// ✅ Start Ride
export const startRide = async (req: Request, res: Response) => {
  const { occurrenceId } = req.params;
  const { lat, lng } = req.body;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new BadRequest("Driver authentication required");
  }

  if (!occurrenceId) {
    throw new BadRequest("Occurrence ID is required");
  }

  const occurrence = await db
    .select({
      occurrenceId: rideOccurrences.id,
      status: rideOccurrences.status,
      rideId: rideOccurrences.rideId,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.driverId, driverId)
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Occurrence not found");
  }

  if (occurrence[0].status !== "scheduled") {
    throw new BadRequest("Ride already started or completed");
  }

  await db.update(rideOccurrences).set({
    status: "in_progress",
    startedAt: sql`NOW()`,
    currentLat: lat || null,
    currentLng: lng || null,
  }).where(eq(rideOccurrences.id, occurrenceId));

  // Get students' parents to notify
  const studentsParents = await db
    .select({
      parentId: parents.id,
      fcmTokens: parents.fcmTokens,
      studentName: students.name,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(students, eq(rideOccurrenceStudents.studentId, students.id))
    .innerJoin(parents, eq(students.parentId, parents.id))
    .where(eq(rideOccurrenceStudents.occurrenceId, occurrenceId));

  // Send notifications
  for (const parent of studentsParents) {
    if (parent.fcmTokens) {
      const tokens = typeof parent.fcmTokens === "string" 
        ? JSON.parse(parent.fcmTokens) 
        : parent.fcmTokens;
      
      if (tokens && tokens.length > 0) {
        await sendPushNotification(
          tokens,
          "Ride Started",
          `The school bus has started. ${parent.studentName} will be picked up soon.`,
          { type: "ride_started", occurrenceId }
        );
      }
    }

    await db.insert(notifications).values({
      userId: parent.parentId,
      userType: "parent",
      title: "Ride Started",
      body: `The school bus has started. ${parent.studentName} will be picked up soon.`,
      type: "ride_started",
      data: JSON.stringify({ occurrenceId }),
    });
  }

  SuccessResponse(res, { 
    message: "Ride started successfully",
    occurrenceId,
    startedAt: new Date().toISOString(),
  }, 200);
};

// ✅ Update Location
export const updateLocation = async (req: Request, res: Response) => {
  const { occurrenceId } = req.params;
  const { lat, lng } = req.body;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new BadRequest("Driver authentication required");
  }

  if (!occurrenceId) {
    throw new BadRequest("Occurrence ID is required");
  }

  if (!lat || !lng) {
    throw new BadRequest("Latitude and longitude are required");
  }

  const occurrence = await db
    .select({ occurrenceId: rideOccurrences.id, status: rideOccurrences.status })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.driverId, driverId),
        eq(rideOccurrences.status, "in_progress")
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Active occurrence not found");
  }

  await db.update(rideOccurrences).set({
    currentLat: lat,
    currentLng: lng,
  }).where(eq(rideOccurrences.id, occurrenceId));

  SuccessResponse(res, { message: "Location updated" }, 200);
};

// ✅ Pick Up Student
export const pickUpStudent = async (req: Request, res: Response) => {
  const { occurrenceId, studentId } = req.params;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new BadRequest("Driver authentication required");
  }

  if (!occurrenceId || !studentId) {
    throw new BadRequest("Occurrence ID and Student ID are required");
  }

  const occurrence = await db
    .select({ occurrenceId: rideOccurrences.id, status: rideOccurrences.status })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.driverId, driverId),
        eq(rideOccurrences.status, "in_progress")
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Active occurrence not found");
  }

  const studentRecord = await db
    .select()
    .from(rideOccurrenceStudents)
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        eq(rideOccurrenceStudents.id, studentId)
      )
    )
    .limit(1);

  if (!studentRecord[0]) {
    throw new NotFound("Student not found in this ride");
  }

  if (studentRecord[0].status !== "pending") {
    throw new BadRequest("Student already processed");
  }

  await db.update(rideOccurrenceStudents).set({
    status: "picked_up",
    pickedUpAt: sql`NOW()`,
  }).where(eq(rideOccurrenceStudents.id, studentId));

  // Notify parent
  const studentInfo = await db
    .select({
      studentName: students.name,
      parentId: parents.id,
      fcmTokens: parents.fcmTokens,
    })
    .from(students)
    .innerJoin(parents, eq(students.parentId, parents.id))
    .where(eq(students.id, studentRecord[0].studentId))
    .limit(1);

  if (studentInfo[0]) {
    const { studentName, parentId, fcmTokens } = studentInfo[0];
    
    if (fcmTokens) {
      const tokens = typeof fcmTokens === "string" ? JSON.parse(fcmTokens) : fcmTokens;
      if (tokens && tokens.length > 0) {
        await sendPushNotification(
          tokens,
          "Student Picked Up",
          `${studentName} has been picked up by the school bus.`,
          { type: "student_picked_up", occurrenceId, studentId: studentRecord[0].studentId }
        );
      }
    }

    await db.insert(notifications).values({
      userId: parentId,
      userType: "parent",
      title: "Student Picked Up",
      body: `${studentName} has been picked up by the school bus.`,
      type: "student_picked_up",
      data: JSON.stringify({ occurrenceId, studentId: studentRecord[0].studentId }),
    });
  }

  SuccessResponse(res, { message: "Student picked up successfully" }, 200);
};

// ✅ Drop Off Student
export const dropOffStudent = async (req: Request, res: Response) => {
  const { occurrenceId, studentId } = req.params;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new BadRequest("Driver authentication required");
  }

  if (!occurrenceId || !studentId) {
    throw new BadRequest("Occurrence ID and Student ID are required");
  }

  const occurrence = await db
    .select({ occurrenceId: rideOccurrences.id })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.driverId, driverId),
        eq(rideOccurrences.status, "in_progress")
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Active occurrence not found");
  }

  const studentRecord = await db
    .select()
    .from(rideOccurrenceStudents)
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        eq(rideOccurrenceStudents.id, studentId)
      )
    )
    .limit(1);

  if (!studentRecord[0]) {
    throw new NotFound("Student not found in this ride");
  }

  if (studentRecord[0].status !== "picked_up") {
    throw new BadRequest("Student must be picked up first");
  }

  await db.update(rideOccurrenceStudents).set({
    status: "dropped_off",
    droppedOffAt: sql`NOW()`,
  }).where(eq(rideOccurrenceStudents.id, studentId));

  // Notify parent
  const studentInfo = await db
    .select({
      studentName: students.name,
      parentId: parents.id,
      fcmTokens: parents.fcmTokens,
    })
    .from(students)
    .innerJoin(parents, eq(students.parentId, parents.id))
    .where(eq(students.id, studentRecord[0].studentId))
    .limit(1);

  if (studentInfo[0]) {
    const { studentName, parentId, fcmTokens } = studentInfo[0];
    
    if (fcmTokens) {
      const tokens = typeof fcmTokens === "string" ? JSON.parse(fcmTokens) : fcmTokens;
      if (tokens && tokens.length > 0) {
        await sendPushNotification(
          tokens,
          "Student Dropped Off",
          `${studentName} has arrived safely.`,
          { type: "student_dropped_off", occurrenceId }
        );
      }
    }

    await db.insert(notifications).values({
      userId: parentId,
      userType: "parent",
      title: "Student Dropped Off",
      body: `${studentName} has arrived safely.`,
      type: "student_dropped_off",
      data: JSON.stringify({ occurrenceId }),
    });
  }

  SuccessResponse(res, { message: "Student dropped off successfully" }, 200);
};

// ✅ Mark Student Absent
export const markStudentAbsent = async (req: Request, res: Response) => {
  const { occurrenceId, studentId } = req.params;
  const { reason } = req.body;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new BadRequest("Driver authentication required");
  }

  if (!occurrenceId || !studentId) {
    throw new BadRequest("Occurrence ID and Student ID are required");
  }

  const occurrence = await db
    .select({ occurrenceId: rideOccurrences.id })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.driverId, driverId),
        eq(rideOccurrences.status, "in_progress")
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Active occurrence not found");
  }

  const studentRecord = await db
    .select()
    .from(rideOccurrenceStudents)
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        eq(rideOccurrenceStudents.id, studentId)
      )
    )
    .limit(1);

  if (!studentRecord[0]) {
    throw new NotFound("Student not found in this ride");
  }

  if (studentRecord[0].status !== "pending") {
    throw new BadRequest("Student already processed");
  }

  await db.update(rideOccurrenceStudents).set({
    status: "absent",
    excuseReason: reason || null,
  }).where(eq(rideOccurrenceStudents.id, studentId));

  SuccessResponse(res, { message: "Student marked as absent" }, 200);
};

// ✅ Complete Ride
export const completeRide = async (req: Request, res: Response) => {
  const { occurrenceId } = req.params;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new BadRequest("Driver authentication required");
  }

  if (!occurrenceId) {
    throw new BadRequest("Occurrence ID is required");
  }

  const occurrence = await db
    .select({ occurrenceId: rideOccurrences.id, status: rideOccurrences.status })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rideOccurrences.id, occurrenceId),
        eq(rides.driverId, driverId)
      )
    )
    .limit(1);

  if (!occurrence[0]) {
    throw new NotFound("Occurrence not found");
  }

  if (occurrence[0].status !== "in_progress") {
    throw new BadRequest("Ride is not in progress");
  }

  const pendingStudents = await db
    .select()
    .from(rideOccurrenceStudents)
    .where(
      and(
        eq(rideOccurrenceStudents.occurrenceId, occurrenceId),
        eq(rideOccurrenceStudents.status, "pending")
      )
    );

  if (pendingStudents.length > 0) {
    throw new BadRequest(`${pendingStudents.length} students still pending`);
  }

  await db.update(rideOccurrences).set({
    status: "completed",
    completedAt: sql`NOW()`,
  }).where(eq(rideOccurrences.id, occurrenceId));

  // Notify all parents
  const studentsParents = await db
    .select({
      parentId: parents.id,
      fcmTokens: parents.fcmTokens,
    })
    .from(rideOccurrenceStudents)
    .innerJoin(students, eq(rideOccurrenceStudents.studentId, students.id))
    .innerJoin(parents, eq(students.parentId, parents.id))
    .where(eq(rideOccurrenceStudents.occurrenceId, occurrenceId));

  for (const parent of studentsParents) {
    if (parent.fcmTokens) {
      const tokens = typeof parent.fcmTokens === "string" 
        ? JSON.parse(parent.fcmTokens) 
        : parent.fcmTokens;
      
      if (tokens && tokens.length > 0) {
        await sendPushNotification(
          tokens,
          "Ride Completed",
          "The school bus ride has been completed.",
          { type: "ride_completed", occurrenceId }
        );
      }
    }

    await db.insert(notifications).values({
      userId: parent.parentId,
      userType: "parent",
      title: "Ride Completed",
      body: "The school bus ride has been completed.",
      type: "ride_completed",
      data: JSON.stringify({ occurrenceId }),
    });
  }

  SuccessResponse(res, { 
    message: "Ride completed successfully",
    completedAt: new Date().toISOString(),
  }, 200);
};

export const getUpcomingRides = async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const organizationId = req.user?.organizationId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  if (!driverId || !organizationId) {
    throw new BadRequest("Driver authentication required");
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // جلب الرحلات القادمة (بعد اليوم)
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
      plateNumber: buses.plateNumber,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(
      and(
        eq(rides.driverId, driverId),
        eq(rides.organizationId, organizationId),
        sql`DATE(${rideOccurrences.occurDate}) > ${todayStr}`,
        or(
          eq(rideOccurrences.status, "scheduled"),
          eq(rideOccurrences.status, "in_progress")
        )
      )
    )
    .orderBy(asc(rideOccurrences.occurDate))
    .limit(limit)
    .offset(offset);

  // عد الإجمالي
  const [totalResult] = await db
    .select({ count: count() })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(
      and(
        eq(rides.driverId, driverId),
        eq(rides.organizationId, organizationId),
        sql`DATE(${rideOccurrences.occurDate}) > ${todayStr}`,
        or(
          eq(rideOccurrences.status, "scheduled"),
          eq(rideOccurrences.status, "in_progress")
        )
      )
    );

  // عد الطلاب لكل occurrence
  const ridesWithCounts = await Promise.all(
    upcomingOccurrences.map(async (occ) => {
      const [studentCount] = await db
        .select({ count: count() })
        .from(rideOccurrenceStudents)
        .where(eq(rideOccurrenceStudents.occurrenceId, occ.occurrenceId));

      return {
        ...occ,
        studentCount: studentCount?.count || 0,
      };
    })
  );

  // تجميع حسب التاريخ
  const groupedByDate = ridesWithCounts.reduce((acc, ride) => {
    const dateKey = ride.occurDate instanceof Date 
      ? ride.occurDate.toISOString().split("T")[0]
      : String(ride.occurDate);
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(ride);
    return acc;
  }, {} as Record<string, typeof ridesWithCounts>);

  return SuccessResponse(res, {
    rides: groupedByDate, message:"Upcoming rides fetched successfully"})
   
};

// ===================== GET RIDE HISTORY =====================
export const getRideHistory = async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const organizationId = req.user?.organizationId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const from = req.query.from as string;
  const to = req.query.to as string;

  if (!driverId || !organizationId) {
    throw new BadRequest("Driver authentication required");
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // بناء شروط التصفية
  const conditions = [
    eq(rides.driverId, driverId),
    eq(rides.organizationId, organizationId),
    or(
      sql`DATE(${rideOccurrences.occurDate}) < ${todayStr}`,
      eq(rideOccurrences.status, "completed"),
      eq(rideOccurrences.status, "cancelled")
    ),
  ];

  // إضافة فلتر التاريخ إذا موجود
  if (from) {
    conditions.push(sql`DATE(${rideOccurrences.occurDate}) >= ${from}`);
  }
  if (to) {
    conditions.push(sql`DATE(${rideOccurrences.occurDate}) <= ${to}`);
  }

  // جلب السجل
  const historyOccurrences = await db
    .select({
      occurrenceId: rideOccurrences.id,
      occurDate: rideOccurrences.occurDate,
      occurrenceStatus: rideOccurrences.status,
      startedAt: rideOccurrences.startedAt,
      completedAt: rideOccurrences.completedAt,
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      routeId: Rout.id,
      routeName: Rout.name,
    })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .leftJoin(buses, eq(rides.busId, buses.id))
    .leftJoin(Rout, eq(rides.routeId, Rout.id))
    .where(and(...conditions))
    .orderBy(desc(rideOccurrences.occurDate))
    .limit(limit)
    .offset(offset);

  // عد الإجمالي
  const [totalResult] = await db
    .select({ count: count() })
    .from(rideOccurrences)
    .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
    .where(and(...conditions));

  // عد الطلاب وإحصائياتهم لكل occurrence
  const ridesWithStats = await Promise.all(
    historyOccurrences.map(async (occ) => {
      const studentStats = await db
        .select({
          status: rideOccurrenceStudents.status,
          count: count(),
        })
        .from(rideOccurrenceStudents)
        .where(eq(rideOccurrenceStudents.occurrenceId, occ.occurrenceId))
        .groupBy(rideOccurrenceStudents.status);

      const stats = {
        total: 0,
        pickedUp: 0,
        droppedOff: 0,
        absent: 0,
        excused: 0,
      };

      studentStats.forEach((s) => {
        stats.total += Number(s.count);
        if (s.status === "picked_up") stats.pickedUp = Number(s.count);
        if (s.status === "dropped_off") stats.droppedOff = Number(s.count);
        if (s.status === "absent") stats.absent = Number(s.count);
        if (s.status === "excused") stats.excused = Number(s.count);
      });

      return {
        ...occ,
        studentStats: stats,
      };
    })
  );

  // تجميع حسب التاريخ
  const groupedByDate = ridesWithStats.reduce((acc, ride) => {
    const dateKey = ride.occurDate instanceof Date 
      ? ride.occurDate.toISOString().split("T")[0]
      : String(ride.occurDate);
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(ride);
    return acc;
  }, {} as Record<string, typeof ridesWithStats>);

   SuccessResponse(res, { rides: groupedByDate,message:"Ride history fetched successfully"  });
}