// src/cron/generateOccurrences.ts
import cron from "node-cron";
import { db } from "../models/db";
import { rides, rideStudents, rideOccurrences, rideOccurrenceStudents } from "../models/schema";
import { eq, and, desc } from "drizzle-orm";

export const startGenerateOccurrencesCron = () => {
  // Run daily at 1:00 AM
  cron.schedule("0 1 * * *", async () => {
    console.log("[CRON] Generating future occurrences...");

    try {
      // Get unlimited rides
      const unlimitedRides = await db
        .select()
        .from(rides)
        .where(
          and(
            eq(rides.frequency, "repeat"),
            eq(rides.repeatType, "unlimited"),
            eq(rides.isActive, "on")
          )
        );

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);

      for (const ride of unlimitedRides) {
        // Get last occurrence
        const lastOcc = await db
          .select()
          .from(rideOccurrences)
          .where(eq(rideOccurrences.rideId, ride.id))
          .orderBy(desc(rideOccurrences.occurDate))
          .limit(1);

        const lastDate = lastOcc[0]
          ? new Date(lastOcc[0].occurDate)
          : new Date(ride.startDate);

        // Get ride students template
        const rideStudentsList = await db
          .select()
          .from(rideStudents)
          .where(eq(rideStudents.rideId, ride.id));

        // Generate missing days
        const current = new Date(lastDate);
        current.setDate(current.getDate() + 1);

        while (current <= futureDate) {
          const occurDateValue = new Date(current);

          // ✅ Insert وبعدها نجلب الـ ID
          await db.insert(rideOccurrences).values({
            rideId: ride.id,
            occurDate: occurDateValue,
          });

          // ✅ جلب آخر occurrence تم إدراجه
          const [inserted] = await db
            .select({ id: rideOccurrences.id })
            .from(rideOccurrences)
            .where(
              and(
                eq(rideOccurrences.rideId, ride.id),
                eq(rideOccurrences.occurDate, occurDateValue)
              )
            )
            .orderBy(desc(rideOccurrences.createdAt))
            .limit(1);

          if (inserted && rideStudentsList.length > 0) {
            const occStudents = rideStudentsList.map((s) => ({
              occurrenceId: inserted.id,
              studentId: s.studentId,
              pickupPointId: s.pickupPointId,
              pickupTime: s.pickupTime,
            }));
            await db.insert(rideOccurrenceStudents).values(occStudents);
          }

          current.setDate(current.getDate() + 1);
        }

        console.log(`[CRON] Generated occurrences for ride: ${ride.id}`);
      }

      console.log("[CRON] Completed generating occurrences");
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  console.log("[CRON] Generate occurrences job scheduled (daily at 1:00 AM)");
};
