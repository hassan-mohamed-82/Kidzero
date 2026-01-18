"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGenerateOccurrencesCron = void 0;
// src/cron/generateOccurrences.ts
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const startGenerateOccurrencesCron = () => {
    // Run daily at 1:00 AM
    node_cron_1.default.schedule("0 1 * * *", async () => {
        console.log("[CRON] Generating future occurrences...");
        try {
            // Get unlimited rides
            const unlimitedRides = await db_1.db
                .select()
                .from(schema_1.rides)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.frequency, "repeat"), (0, drizzle_orm_1.eq)(schema_1.rides.repeatType, "unlimited"), (0, drizzle_orm_1.eq)(schema_1.rides.isActive, "on")));
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + 30);
            for (const ride of unlimitedRides) {
                // Get last occurrence
                const lastOcc = await db_1.db
                    .select()
                    .from(schema_1.rideOccurrences)
                    .where((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, ride.id))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.rideOccurrences.occurDate))
                    .limit(1);
                const lastDate = lastOcc[0]
                    ? new Date(lastOcc[0].occurDate)
                    : new Date(ride.startDate);
                // Get ride students template
                const rideStudentsList = await db_1.db
                    .select()
                    .from(schema_1.rideStudents)
                    .where((0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, ride.id));
                // Generate missing days
                const current = new Date(lastDate);
                current.setDate(current.getDate() + 1);
                while (current <= futureDate) {
                    const occurDateValue = new Date(current);
                    // ✅ Insert وبعدها نجلب الـ ID
                    await db_1.db.insert(schema_1.rideOccurrences).values({
                        rideId: ride.id,
                        occurDate: occurDateValue,
                    });
                    // ✅ جلب آخر occurrence تم إدراجه
                    const [inserted] = await db_1.db
                        .select({ id: schema_1.rideOccurrences.id })
                        .from(schema_1.rideOccurrences)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, ride.id), (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.occurDate, occurDateValue)))
                        .orderBy((0, drizzle_orm_1.desc)(schema_1.rideOccurrences.createdAt))
                        .limit(1);
                    if (inserted && rideStudentsList.length > 0) {
                        const occStudents = rideStudentsList.map((s) => ({
                            occurrenceId: inserted.id,
                            studentId: s.studentId,
                            pickupPointId: s.pickupPointId,
                            pickupTime: s.pickupTime,
                        }));
                        await db_1.db.insert(schema_1.rideOccurrenceStudents).values(occStudents);
                    }
                    current.setDate(current.getDate() + 1);
                }
                console.log(`[CRON] Generated occurrences for ride: ${ride.id}`);
            }
            console.log("[CRON] Completed generating occurrences");
        }
        catch (error) {
            console.error("[CRON] Error:", error);
        }
    });
    console.log("[CRON] Generate occurrences job scheduled (daily at 1:00 AM)");
};
exports.startGenerateOccurrencesCron = startGenerateOccurrencesCron;
