// birthdayCron.ts
import cron from "node-cron";
import { db } from "../models/db"; // Your DB connection (e.g., Drizzle, Prisma, etc.)
import { users } from "../models/schema"; // Adjust this to your ORM/DB schema
import admin from "./firebase";
import { sql } from "drizzle-orm";
// Runs every day at 9:00 AM
cron.schedule("0 6 * * *", async () => {
    try {
        const today = new Date();
        const month = today.getMonth() + 1; // JS months are 0-based
        const day = today.getDate();
        const birthdayUsers = await db
            .select()
            .from(users)
            .where(sql `MONTH(${users.dateOfBirth}) = ${month} AND DAY(${users.dateOfBirth}) = ${day}`);
        for (const user of birthdayUsers) {
            if (user.fcmtoken) {
                await admin.messaging().send({
                    token: user.fcmtoken,
                    notification: {
                        title: "🎉 Happy Birthday!",
                        body: `Happy Birthday, ${user.name}! 🎂`,
                    },
                    data: {
                        type: "BIRTHDAY",
                    },
                });
            }
        }
        console.log(`[Cron] Birthday notifications sent to ${birthdayUsers.length} users.`);
    }
    catch (error) {
        console.error(`[Cron Error]`, error);
    }
});
//# sourceMappingURL=birthDateCron.js.map