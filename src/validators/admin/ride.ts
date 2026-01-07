// src/validations/rideValidation.ts

import { z } from "zod";

export const createRideSchema = z.object({
    body: z.object({
        busId: z.string().uuid("Invalid Bus ID"),
        driverId: z.string().uuid("Invalid Driver ID"),
        codriverId: z.string().uuid("Invalid Codriver ID").optional(),
        routeId: z.string().uuid("Invalid Route ID"),
        name: z.string().max(255).optional(),
        rideType: z.enum(["morning", "afternoon"]),
        frequency: z.enum(["once", "repeat"]),
        repeatType: z.enum(["limited", "unlimited"]).optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        students: z.array(z.object({
            studentId: z.string().uuid("Invalid Student ID"),
            pickupPointId: z.string().uuid("Invalid Pickup Point ID"),
            pickupTime: z.string().optional(),
        })).min(1, "At least one student is required"),
    }).refine((data) => {
        if (data.frequency === "repeat" && !data.repeatType) {
            return false;
        }
        return true;
    }, { message: "repeatType is required when frequency is repeat" })
    .refine((data) => {
        if (data.repeatType === "limited" && !data.endDate) {
            return false;
        }
        return true;
    }, { message: "endDate is required when repeatType is limited" }),
});

export const updateRideSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Ride ID"),
    }),
    body: z.object({
        busId: z.string().uuid().optional(),
        driverId: z.string().uuid().optional(),
        codriverId: z.string().uuid().nullable().optional(),
        routeId: z.string().uuid().optional(),
        name: z.string().max(255).nullable().optional(),
        rideType: z.enum(["morning", "afternoon"]).optional(),
        frequency: z.enum(["once", "repeat"]).optional(),
        repeatType: z.enum(["limited", "unlimited"]).nullable().optional(),
        startDate: z.string().optional(),
        endDate: z.string().nullable().optional(),
        isActive: z.enum(["on", "off"]).optional(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
    }),
});

export const rideIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Ride ID"),
    }),
});

export const addStudentsToRideSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Ride ID"),
    }),
    body: z.object({
        students: z.array(z.object({
            studentId: z.string().uuid("Invalid Student ID"),
            pickupPointId: z.string().uuid("Invalid Pickup Point ID"),
            pickupTime: z.string().optional(),
        })).min(1, "At least one student is required"),
    }),
});

export const updateRideStudentSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Ride ID"),
        studentId: z.string().uuid("Invalid Student ID"),
    }),
    body: z.object({
        pickupPointId: z.string().uuid().optional(),
        pickupTime: z.string().nullable().optional(),
        status: z.enum(["pending", "picked_up", "dropped_off", "absent", "excused"]).optional(),
        excuseReason: z.string().nullable().optional(),
    }),
});

export const removeStudentFromRideSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Ride ID"),
        studentId: z.string().uuid("Invalid Student ID"),
    }),
});
