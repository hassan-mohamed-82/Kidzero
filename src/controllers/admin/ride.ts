// src/controllers/admin/rideController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { rides, rideStudents, buses, drivers, codrivers, Rout, routePickupPoints, students, pickupPoints } from "../../models/schema";
import { eq, and, inArray,count } from "drizzle-orm";
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
            createdAt: rides.createdAt,
            bus: {
                id: buses.id,
                busNumber: buses.busNumber,
            },
            driver: {
                id: drivers.id,
                name: drivers.name,
            },
            route: {
                id: Rout.id,
                name: Rout.name,
            },
        })
        .from(rides)
        .leftJoin(buses, eq(rides.busId, buses.id))
        .leftJoin(drivers, eq(rides.driverId, drivers.id))
        .leftJoin(Rout, eq(rides.routeId, Rout.id))
        .where(eq(rides.organizationId, organizationId));

    SuccessResponse(res, { rides: allRides }, 200);
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
            status: rides.status,
            startedAt: rides.startedAt,
            completedAt: rides.completedAt,
            currentLat: rides.currentLat,
            currentLng: rides.currentLng,
            createdAt: rides.createdAt,
            bus: {
                id: buses.id,
                busNumber: buses.busNumber,
            },
            driver: {
                id: drivers.id,
                name: drivers.name,
                phone: drivers.phone,
            },
            route: {
                id: Rout.id,
                name: Rout.name,
            },
        })
        .from(rides)
        .leftJoin(buses, eq(rides.busId, buses.id))
        .leftJoin(drivers, eq(rides.driverId, drivers.id))
        .leftJoin(Rout, eq(rides.routeId, Rout.id))
        .where(and(eq(rides.id, id), eq(rides.organizationId, organizationId)))
        .limit(1);

    if (!ride[0]) {
        throw new NotFound("Ride not found");
    }

    // Get ride students
    const rideStudentsList = await db
        .select({
            id: rideStudents.id,
            pickupTime: rideStudents.pickupTime,
            status: rideStudents.status,
            excuseReason: rideStudents.excuseReason,
            pickedUpAt: rideStudents.pickedUpAt,
            droppedOffAt: rideStudents.droppedOffAt,
            student: {
                id: students.id,
                name: students.name,
                avatar: students.avatar,
                grade: students.grade,
                classroom: students.classroom,
            },
            pickupPoint: {
                id: pickupPoints.id,
                name: pickupPoints.name,
                address: pickupPoints.address,
            },
        })
        .from(rideStudents)
        .leftJoin(students, eq(rideStudents.studentId, students.id))
        .leftJoin(pickupPoints, eq(rideStudents.pickupPointId, pickupPoints.id))
        .where(eq(rideStudents.rideId, id));

    SuccessResponse(res, { ride: { ...ride[0], students: rideStudentsList } }, 200);
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
