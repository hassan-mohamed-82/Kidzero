// src/controllers/mobile/parentController.ts

import { Request, Response } from "express";
import { db } from "../../../models/db";
import {
  students,
  rides,
  rideStudents,
  buses,
  drivers,
  codrivers,
  Rout,
  routePickupPoints,
  pickupPoints,
} from "../../../models/schema";
import { eq, and, inArray, gte, lte, sql, or } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound, UnauthorizedError,  } from "../../../Errors";
import { BadRequest } from "../../../Errors/BadRequest";

// ==========================================
// Helper: الحصول على بداية ونهاية اليوم
// ==========================================
const getTodayRange = () => {
  const now = new Date();
  
  // بداية اليوم (00:00:00)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  // نهاية اليوم (23:59:59.999)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
};

// ==========================================
// Helper: تحويل التاريخ لصيغة MySQL
// ==========================================
const formatDateForMySQL = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};


// ==========================================
// . رحلات اليوم - الحل المصحح
// ==========================================
export const getTodayRides = async (req: Request, res: Response) => {
    const parentId = req.user?.id;

    if (!parentId) {
        throw new UnauthorizedError("Not authenticated");
    }

    // 1) جلب الأبناء
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
        return SuccessResponse(res, { rides: [], message: "No children found" }, 200);
    }

    const childIds = myChildren.map((c) => c.id);

    // 2) جلب رحلات اليوم - استخدام CURDATE() أفضل
    const todayRides = await db
        .select({
            rideId: rides.id,
            rideName: rides.name,
            rideType: rides.rideType,
            rideStatus: rides.status,
            startDate: rides.startDate,
            endDate: rides.endDate,
            isActive: rides.isActive,
            startedAt: rides.startedAt,
            completedAt: rides.completedAt,
            currentLat: rides.currentLat,
            currentLng: rides.currentLng,
            // Bus info
            busId: buses.id,
            busNumber: buses.busNumber,
            plateNumber: buses.plateNumber,
            // Driver info
            driverId: drivers.id,
            driverName: drivers.name,
            driverPhone: drivers.phone,
            driverAvatar: drivers.avatar,
            // Codriver info
            codriverId: codrivers.id,
            codriverName: codrivers.name,
            codriverPhone: codrivers.phone,
            // Route info
            routeId: Rout.id,
            routeName: Rout.name,
            // Student in ride info
            studentId: rideStudents.studentId,
            pickupPointId: rideStudents.pickupPointId,
            pickupTime: rideStudents.pickupTime,
            studentStatus: rideStudents.status,
            excuseReason: rideStudents.excuseReason,
            pickedUpAt: rideStudents.pickedUpAt,
            droppedOffAt: rideStudents.droppedOffAt,
        })
        .from(rides)
        .innerJoin(rideStudents, eq(rideStudents.rideId, rides.id))
        .leftJoin(buses, eq(buses.id, rides.busId))
        .leftJoin(drivers, eq(drivers.id, rides.driverId))
        .leftJoin(codrivers, eq(codrivers.id, rides.codriverId))
        .leftJoin(Rout, eq(Rout.id, rides.routeId))
        .where(
            and(
                inArray(rideStudents.studentId, childIds),
                // ✅ استخدم DATE() للمقارنة بالتاريخ فقط بدون الوقت
                sql`DATE(${rides.startDate}) = CURDATE()`
            )
        );

    // 3) إذا لم توجد رحلات
    if (todayRides.length === 0) {
        return SuccessResponse(res, { rides: [], message: "No rides today" }, 200);
    }

    // 4) تجميع الرحلات مع معلومات الأبناء
    const ridesMap = new Map<string, any>();

    for (const row of todayRides) {
        const child = myChildren.find((c) => c.id === row.studentId);

        if (!ridesMap.has(row.rideId)) {
            ridesMap.set(row.rideId, {
                id: row.rideId,
                name: row.rideName,
                type: row.rideType,
                status: row.rideStatus,
                startDate: row.startDate,
                endDate: row.endDate,
                isActive: row.isActive,
                startedAt: row.startedAt,
                completedAt: row.completedAt,
                currentLocation:
                    row.currentLat && row.currentLng
                        ? { lat: row.currentLat, lng: row.currentLng }
                        : null,
                bus: row.busId
                    ? {
                        id: row.busId,
                        busNumber: row.busNumber,
                        plateNumber: row.plateNumber,
                    }
                    : null,
                driver: row.driverId
                    ? {
                        id: row.driverId,
                        name: row.driverName,
                        phone: row.driverPhone,
                        avatar: row.driverAvatar,
                    }
                    : null,
                codriver: row.codriverId
                    ? {
                        id: row.codriverId,
                        name: row.codriverName,
                        phone: row.codriverPhone,
                    }
                    : null,
                route: row.routeId
                    ? {
                        id: row.routeId,
                        name: row.routeName,
                    }
                    : null,
                children: [],
            });
        }

        if (child) {
            ridesMap.get(row.rideId).children.push({
                id: child.id,
                name: child.name,
                avatar: child.avatar,
                grade: child.grade,
                classroom: child.classroom,
                pickupPointId: row.pickupPointId,
                pickupTime: row.pickupTime,
                status: row.studentStatus,
                excuseReason: row.excuseReason,
                pickedUpAt: row.pickedUpAt,
                droppedOffAt: row.droppedOffAt,
            });
        }
    }

    const formattedRides = Array.from(ridesMap.values());

    return SuccessResponse(res, { rides: formattedRides, count: formattedRides.length }, 200);
};


// ==========================================
// 4. سجل الرحلات السابقة
// ==========================================
export const getRidesHistory = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { childId } = req.query;

  if (!parentId) {
    throw new UnauthorizedError("Not authenticated");
  }

  // جلب الأبناء
  const myChildren = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    return SuccessResponse(res, { rides: [], total: 0 }, 200);
  }

  let targetChildIds = myChildren.map((c) => c.id);

  // إذا تم تحديد طفل معين
  if (childId && typeof childId === "string") {
    const isMyChild = myChildren.some((c) => c.id === childId);
    if (!isMyChild) {
      throw new NotFound("Child not found");
    }
    targetChildIds = [childId];
  }

  const { startOfDay } = getTodayRange();


  // جلب الرحلات المنتهية (قبل اليوم)
  const historyRides = await db
    .select({
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      rideStatus: rides.status,
      startDate: rides.startDate,
      completedAt: rides.completedAt,
      busNumber: buses.busNumber,
      driverName: drivers.name,
      routeName: Rout.name,
      studentId: rideStudents.studentId,
      studentStatus: rideStudents.status,
      pickedUpAt: rideStudents.pickedUpAt,
      droppedOffAt: rideStudents.droppedOffAt,
    })
    .from(rides)
    .innerJoin(rideStudents, eq(rideStudents.rideId, rides.id))
    .leftJoin(buses, eq(buses.id, rides.busId))
    .leftJoin(drivers, eq(drivers.id, rides.driverId))
    .leftJoin(Rout, eq(Rout.id, rides.routeId))
    .where(
      and(
        inArray(rideStudents.studentId, targetChildIds),
        lte(rides.startDate, startOfDay) // الرحلات قبل اليوم
      )
    )
    .orderBy(sql`${rides.startDate} DESC`)
   

  // تجميع مع اسم الطفل
  const ridesWithChild = historyRides.map((r) => ({
    ...r,
    childName: myChildren.find((c) => c.id === r.studentId)?.name || "Unknown",
  }));

  return SuccessResponse(
    res,
    {
      rides: ridesWithChild,
     
    },
    200
  );
};

// ==========================================
// 5. تفاصيل رحلة
// ==========================================
export const getRideDetails = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { rideId } = req.params;

  if (!parentId) {
    throw new UnauthorizedError("Not authenticated");
  }

  // جلب أبنائي
  const myChildren = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    throw new NotFound("No children found");
  }

  const childIds = myChildren.map((c) => c.id);

  // التحقق أن الرحلة تخص أحد أبنائي
  const childInRide = await db
    .select({ studentId: rideStudents.studentId })
    .from(rideStudents)
    .where(
      and(
        eq(rideStudents.rideId, rideId),
        inArray(rideStudents.studentId, childIds)
      )
    )
    .limit(1);

  if (childInRide.length === 0) {
    throw new NotFound("Ride not found or not associated with your children");
  }

  // جلب تفاصيل الرحلة
  const rideData = await db
    .select({
      id: rides.id,
      name: rides.name,
      rideType: rides.rideType,
      status: rides.status,
      startDate: rides.startDate,
      endDate: rides.endDate,
      isActive: rides.isActive,
      startedAt: rides.startedAt,
      completedAt: rides.completedAt,
      currentLat: rides.currentLat,
      currentLng: rides.currentLng,
      // Bus
      busId: buses.id,
      busNumber: buses.busNumber,
      plateNumber: buses.plateNumber,
      maxSeats: buses.maxSeats,
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
    .leftJoin(buses, eq(buses.id, rides.busId))
    .leftJoin(drivers, eq(drivers.id, rides.driverId))
    .leftJoin(codrivers, eq(codrivers.id, rides.codriverId))
    .leftJoin(Rout, eq(Rout.id, rides.routeId))
    .where(eq(rides.id, rideId));

  if (rideData.length === 0) {
    throw new NotFound("Ride not found");
  }

  const ride = rideData[0];

  // جلب أبنائي في هذه الرحلة
  const myChildrenInRide = await db
    .select({
      studentId: rideStudents.studentId,
      pickupPointId: rideStudents.pickupPointId,
      pickupTime: rideStudents.pickupTime,
      status: rideStudents.status,
      excuseReason: rideStudents.excuseReason,
      pickedUpAt: rideStudents.pickedUpAt,
      droppedOffAt: rideStudents.droppedOffAt,
      // Pickup point
      pickupPointName: pickupPoints.name,
      pickupPointAddress: pickupPoints.address,
      pickupPointLat: pickupPoints.lat,
      pickupPointLng: pickupPoints.lng,
    })
    .from(rideStudents)
    .leftJoin(pickupPoints, eq(pickupPoints.id, rideStudents.pickupPointId))
    .where(
      and(
        eq(rideStudents.rideId, rideId),
        inArray(rideStudents.studentId, childIds)
      )
    );

  const childrenDetails = myChildrenInRide.map((rs) => {
    const child = myChildren.find((c) => c.id === rs.studentId);
    return {
      id: rs.studentId,
      name: child?.name || "Unknown",
      pickupPoint: rs.pickupPointId
        ? {
            id: rs.pickupPointId,
            name: rs.pickupPointName,
            address: rs.pickupPointAddress,
            lat: rs.pickupPointLat,
            lng: rs.pickupPointLng,
          }
        : null,
      pickupTime: rs.pickupTime,
      status: rs.status,
      excuseReason: rs.excuseReason,
      pickedUpAt: rs.pickedUpAt,
      droppedOffAt: rs.droppedOffAt,
    };
  });

  // جلب نقاط المسار
  let routeStops: any[] = [];
  if (ride.routeId) {
    const stops = await db
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
      .orderBy(routePickupPoints.stopOrder);

    routeStops = stops;
  }

  return SuccessResponse(
    res,
    {
      ride: {
        id: ride.id,
        name: ride.name,
        type: ride.rideType,
        status: ride.status,
        startDate: ride.startDate,
        endDate: ride.endDate,
        isActive: ride.isActive,
        startedAt: ride.startedAt,
        completedAt: ride.completedAt,
        currentLocation:
          ride.currentLat && ride.currentLng
            ? { lat: ride.currentLat, lng: ride.currentLng }
            : null,
        bus: ride.busId
          ? {
              id: ride.busId,
              busNumber: ride.busNumber,
              plateNumber: ride.plateNumber,
              maxSeats: ride.maxSeats,
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
              stops: routeStops,
            }
          : null,
        myChildren: childrenDetails,
      },
    },
    200
  );
};

// ==========================================
// 6. تتبع الرحلة مباشر
// ==========================================
export const trackRide = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { rideId } = req.params;

  if (!parentId) {
    throw new UnauthorizedError("Not authenticated");
  }

  // التحقق أن الرحلة تخص أحد أبنائي
  const myChildren = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.parentId, parentId));

  if (myChildren.length === 0) {
    throw new NotFound("No children found");
  }

  const childIds = myChildren.map((c) => c.id);

  const childInRide = await db
    .select({ studentId: rideStudents.studentId })
    .from(rideStudents)
    .where(
      and(
        eq(rideStudents.rideId, rideId),
        inArray(rideStudents.studentId, childIds)
      )
    )
    .limit(1);

  if (childInRide.length === 0) {
    throw new NotFound("Ride not found");
  }

  // جلب موقع الرحلة الحالي
  const rideLocation = await db
    .select({
      id: rides.id,
      status: rides.status,
      isActive: rides.isActive,
      currentLat: rides.currentLat,
      currentLng: rides.currentLng,
      startedAt: rides.startedAt,
      driverName: drivers.name,
      driverPhone: drivers.phone,
    })
    .from(rides)
    .leftJoin(drivers, eq(drivers.id, rides.driverId))
    .where(eq(rides.id, rideId));

  if (rideLocation.length === 0) {
    throw new NotFound("Ride not found");
  }

  const ride = rideLocation[0];

  return SuccessResponse(
    res,
    {
      rideId: ride.id,
      status: ride.status,
      isActive: ride.isActive,
      location:
        ride.currentLat && ride.currentLng
          ? { lat: ride.currentLat, lng: ride.currentLng }
          : null,
      startedAt: ride.startedAt,
      driver: {
        name: ride.driverName,
        phone: ride.driverPhone,
      },
    },
    200
  );
};

// ==========================================
// 7. سجل حضور الطفل
// ==========================================
export const getChildAttendance = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { childId } = req.params;
  const { startDate, endDate, page = "1", limit = "20" } = req.query;

  if (!parentId) {
    throw new UnauthorizedError("Not authenticated");
  }

  // التحقق أن الطفل يخصني
  const child = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, childId), eq(students.parentId, parentId)));

  if (child.length === 0) {
    throw new NotFound("Child not found");
  }

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  // بناء الشروط
  const conditions: any[] = [eq(rideStudents.studentId, childId)];

  if (startDate && typeof startDate === "string") {
    conditions.push(gte(rides.startDate, new Date(startDate)));
  }
  if (endDate && typeof endDate === "string") {
    conditions.push(lte(rides.startDate, new Date(endDate)));
  }

  const attendance = await db
    .select({
      rideId: rides.id,
      rideName: rides.name,
      rideType: rides.rideType,
      rideDate: rides.startDate,
      status: rideStudents.status,
      excuseReason: rideStudents.excuseReason,
      pickedUpAt: rideStudents.pickedUpAt,
      droppedOffAt: rideStudents.droppedOffAt,
    })
    .from(rideStudents)
    .innerJoin(rides, eq(rides.id, rideStudents.rideId))
    .where(and(...conditions))
    .orderBy(sql`${rides.startDate} DESC`)
    .limit(limitNum)
    .offset(offset);

  // إحصائيات
  const stats = {
    total: attendance.length,
    pickedUp: attendance.filter((a) => a.status === "picked_up" || a.status === "dropped_off").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    excused: attendance.filter((a) => a.status === "excused").length,
  };

  return SuccessResponse(
    res,
    {
      child: child[0],
      attendance,
      stats,
      page: pageNum,
      limit: limitNum,
    },
    200
  );
};

// ==========================================
// 8. تسجيل عذر غياب
// ==========================================
export const reportAbsence = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { childId } = req.params;
  const { rideId, reason } = req.body;

  if (!parentId) {
    throw new UnauthorizedError("Not authenticated");
  }

  // التحقق أن الطفل يخصني
  const child = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, childId), eq(students.parentId, parentId)));

  if (child.length === 0) {
    throw new NotFound("Child not found");
  }

  // التحقق أن الطفل مسجل في الرحلة
  const rideStudent = await db
    .select({ id: rideStudents.id, status: rideStudents.status })
    .from(rideStudents)
    .where(
      and(eq(rideStudents.rideId, rideId), eq(rideStudents.studentId, childId))
    );

  if (rideStudent.length === 0) {
    throw new NotFound("Child is not in this ride");
  }

  // التحقق أن الحالة ليست picked_up أو dropped_off
  if (rideStudent[0].status === "picked_up" || rideStudent[0].status === "dropped_off") {
    throw new BadRequest("Cannot report absence for a child who has already been picked up");
  }

  // تحديث الحالة
  await db
    .update(rideStudents)
    .set({
      status: "excused",
      excuseReason: reason || "Parent reported absence",
    })
    .where(
      and(eq(rideStudents.rideId, rideId), eq(rideStudents.studentId, childId))
    );

  return SuccessResponse(
    res,
    {
      message: "Absence reported successfully",
      rideId,
      childId,
      status: "excused",
      reason: reason || "Parent reported absence",
    },
    200
  );
};