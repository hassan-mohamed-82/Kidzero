"use strict";
// src/validations/rideValidation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStudentFromRideSchema = exports.getRidesByDateSchema = exports.updateRideStudentSchema = exports.addStudentsToRideSchema = exports.rideIdSchema = exports.updateRideSchema = exports.createRideSchema = void 0;
const zod_1 = require("zod");
exports.createRideSchema = zod_1.z.object({
    body: zod_1.z.object({
        busId: zod_1.z.string().uuid("Invalid Bus ID"),
        driverId: zod_1.z.string().uuid("Invalid Driver ID"),
        codriverId: zod_1.z.string().uuid("Invalid Codriver ID").optional(),
        routeId: zod_1.z.string().uuid("Invalid Route ID"),
        name: zod_1.z.string().max(255).optional(),
        rideType: zod_1.z.enum(["morning", "afternoon"]),
        frequency: zod_1.z.enum(["once", "repeat"]),
        repeatType: zod_1.z.enum(["limited", "unlimited"]).optional(),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string().optional(),
        students: zod_1.z.array(zod_1.z.object({
            studentId: zod_1.z.string().uuid("Invalid Student ID"),
            pickupPointId: zod_1.z.string().uuid("Invalid Pickup Point ID"),
            pickupTime: zod_1.z.string().optional(),
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
exports.updateRideSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Ride ID"),
    }),
    body: zod_1.z.object({
        busId: zod_1.z.string().uuid().optional(),
        driverId: zod_1.z.string().uuid().optional(),
        codriverId: zod_1.z.string().uuid().nullable().optional(),
        routeId: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().max(255).nullable().optional(),
        rideType: zod_1.z.enum(["morning", "afternoon"]).optional(),
        frequency: zod_1.z.enum(["once", "repeat"]).optional(),
        repeatType: zod_1.z.enum(["limited", "unlimited"]).nullable().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().nullable().optional(),
        isActive: zod_1.z.enum(["on", "off"]).optional(),
        status: zod_1.z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
    }),
});
exports.rideIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Ride ID"),
    }),
});
exports.addStudentsToRideSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Ride ID"),
    }),
    body: zod_1.z.object({
        students: zod_1.z.array(zod_1.z.object({
            studentId: zod_1.z.string().uuid("Invalid Student ID"),
            pickupPointId: zod_1.z.string().uuid("Invalid Pickup Point ID"),
            pickupTime: zod_1.z.string().optional(),
        })).min(1, "At least one student is required"),
    }),
});
exports.updateRideStudentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Ride ID"),
        studentId: zod_1.z.string().uuid("Invalid Student ID"),
    }),
    body: zod_1.z.object({
        pickupPointId: zod_1.z.string().uuid().optional(),
        pickupTime: zod_1.z.string().nullable().optional(),
        status: zod_1.z.enum(["pending", "picked_up", "dropped_off", "absent", "excused"]).optional(),
        excuseReason: zod_1.z.string().nullable().optional(),
    }),
});
exports.getRidesByDateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    }),
});
exports.removeStudentFromRideSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Ride ID"),
        studentId: zod_1.z.string().uuid("Invalid Student ID"),
    }),
});
