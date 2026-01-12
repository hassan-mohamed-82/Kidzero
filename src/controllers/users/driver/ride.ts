import { Request, Response } from 'express';
import { db } from '../../../models/db';
import { rides, rideStudents } from '../../../models/schema';
import { eq } from 'drizzle-orm';
import { SuccessResponse } from '../../../utils/response';
import { BadRequest } from '../../../Errors/BadRequest';
import { drivers } from '../../../models/schema';

export const getAllRides = async (req: Request, res: Response) => {
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest("Invalid driver id");
    }
    const driver = await db.query.drivers.findFirst({
        where: eq(drivers.id, driverId)
    });
    if (!driver) {
        throw new BadRequest("Invalid driver id");
    }

    const DriverRides = await db.select().from(rides).where(eq(rides.driverId, driverId));
    return SuccessResponse(res, { message: "Driver Rides Fetched Successfully", DriverRides }, 200);
};

export const getRideById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Invalid ride id");
    }
    const ride = await db.query.rides.findFirst({
        where: eq(rides.id, id)
    });
    if (!ride) {
        throw new BadRequest("Invalid ride id");
    }
    return SuccessResponse(res, { message: "Ride Fetched Successfully", ride }, 200);
};

// Start Ride - with notification TODO
export const startRide = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Invalid ride id");
    }
    const ride = await db.query.rides.findFirst({
        where: eq(rides.id, id)
    });
    if (!ride) {
        throw new BadRequest("Invalid ride id");
    }
    switch (ride.status) {
        case "in_progress":
            throw new BadRequest("This Ride is already started");
        case "completed":
            throw new BadRequest("This Ride is completed");
        case "cancelled":
            throw new BadRequest("This Ride is cancelled");
    }
    const startedTime = new Date();
    await db.update(rides)
        .set({
            status: "in_progress",
            startedAt: startedTime,
        })
        .where(eq(rides.id, id));

    // TODO : Notification to Students next Pickup Point
    return SuccessResponse(res, { message: "Ride Started Successfully", ride }, 200);
};
// End Ride - with notification TODO
export const endRide = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Invalid ride id");
    }
    const ride = await db.query.rides.findFirst({
        where: eq(rides.id, id)
    });
    if (!ride) {
        throw new BadRequest("Invalid ride id");
    }
    switch (ride.status) {
        case "completed":
            throw new BadRequest("This Ride is already completed");
        case "cancelled":
            throw new BadRequest("This Ride is cancelled");
    }
    const completedTime = new Date();
    await db.update(rides)
        .set({
            status: "completed",
            completedAt: completedTime,
        })
        .where(eq(rides.id, id));
    // TODO : Notification TODO
    return SuccessResponse(res, { message: "Ride Completed Successfully", ride }, 200);
};

// Array Ride Student - Update Status for every Ride Student - ExecuseReason given - 
export const updateStudentRide = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Invalid Student Ride id");
    }
    const { status } = req.body;
    if (!status) {
        throw new BadRequest("Please provide status");
    }
    if (!status || !["pending", "picked_up", "dropped_off", "absent", "excused"].includes(status as string)) {
        throw new BadRequest("Invalid status");
    }
    const studentRide = await db.query.rideStudents.findFirst({
        where: eq(rideStudents.id, id)
    });
    if (!studentRide) {
        throw new BadRequest("Invalid Student ride id");
    }
    // if (status === "excused") {
    //     await db.update(rideStudents)
    //         .set({
    //             status,
    //             excuseReason: excuse_reason,
    //         })
    //         .where(eq(rideStudents.id, id));
    // }
    // return SuccessResponse(res, { message: "Ride Updated Successfully", ride }, 200);
};


