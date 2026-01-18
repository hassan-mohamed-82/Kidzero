"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
// Helper to get dates relative to now
const daysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};
const defaultPromocodes = [
    {
        name: "Welcome Discount",
        code: "WELCOME10",
        amount: 10,
        promocodeType: "percentage",
        description: "10% off for new customers",
        startDate: new Date(),
        endDate: daysFromNow(365),
    },
    {
        name: "Summer Special",
        code: "SUMMER20",
        amount: 20,
        promocodeType: "percentage",
        description: "20% summer discount",
        startDate: new Date(),
        endDate: daysFromNow(90),
    },
    {
        name: "Early Bird Discount",
        code: "EARLYBIRD",
        amount: 50,
        promocodeType: "amount",
        description: "50 EGP off for early registrations",
        startDate: new Date(),
        endDate: daysFromNow(60),
    },
    {
        name: "Back to School",
        code: "SCHOOL2026",
        amount: 15,
        promocodeType: "percentage",
        description: "15% off for the new school year",
        startDate: new Date(),
        endDate: daysFromNow(180),
    },
];
const seed = {
    name: "09_promocodes",
    async run() {
        console.log("   📝 Inserting promo codes...");
        for (const promo of defaultPromocodes) {
            await db_1.db.insert(schema_1.promocode).values({
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
        await db_1.db.delete(schema_1.promocode).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
