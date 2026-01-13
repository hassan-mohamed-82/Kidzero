import { db } from "../../models/db";
import { promocode } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";

// Helper to get dates relative to now
const daysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

const defaultPromocodes = [
    {
        name: "Welcome Discount",
        code: "WELCOME10",
        amount: 10,
        promocodeType: "percentage" as const,
        description: "10% off for new customers",
        startDate: new Date(),
        endDate: daysFromNow(365),
    },
    {
        name: "Summer Special",
        code: "SUMMER20",
        amount: 20,
        promocodeType: "percentage" as const,
        description: "20% summer discount",
        startDate: new Date(),
        endDate: daysFromNow(90),
    },
    {
        name: "Early Bird Discount",
        code: "EARLYBIRD",
        amount: 50,
        promocodeType: "amount" as const,
        description: "50 EGP off for early registrations",
        startDate: new Date(),
        endDate: daysFromNow(60),
    },
    {
        name: "Back to School",
        code: "SCHOOL2026",
        amount: 15,
        promocodeType: "percentage" as const,
        description: "15% off for the new school year",
        startDate: new Date(),
        endDate: daysFromNow(180),
    },
];

const seed: Seed = {
    name: "09_promocodes",

    async run() {
        console.log("   📝 Inserting promo codes...");

        for (const promo of defaultPromocodes) {
            await db.insert(promocode).values({
                name: promo.name,
                code: promo.code,
                amount: promo.amount,
                promocodeType: promo.promocodeType,
                description: promo.description,
                startDate: promo.startDate,
                endDate: promo.endDate,
            });
        }

        console.log(`   📝 Inserted ${defaultPromocodes.length} promo codes`);
    },

    async rollback() {
        await db.delete(promocode).where(sql`1=1`);
    },
};

export default seed;
