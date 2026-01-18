"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const seed = {
    name: "04_plans",
    async run() {
        console.log("   📝 Inserting subscription plans...");
        const defaultPlans = [
            {
                name: "Basic Plan",
                price: 50,
                maxBuses: 5,
                maxDrivers: 10,
                maxStudents: 50,
                subscriptionFees: 1000,
                minSubscriptionFeesPay: 500,
            },
            {
                name: "Standard Plan",
                price: 100,
                maxBuses: 15,
                maxDrivers: 30,
                maxStudents: 200,
                subscriptionFees: 2000,
                minSubscriptionFeesPay: 1000,
            },
            {
                name: "Premium Plan",
                price: 200,
                maxBuses: 50,
                maxDrivers: 100,
                maxStudents: 500,
                subscriptionFees: 3000,
                minSubscriptionFeesPay: 1500,
            },
            {
                name: "Enterprise Plan",
                price: 500,
                maxBuses: 200,
                maxDrivers: 400,
                maxStudents: 2000,
                subscriptionFees: 5000,
                minSubscriptionFeesPay: 2500,
            },
        ];
        for (const plan of defaultPlans) {
            await db_1.db.insert(schema_1.plans).values({
                name: plan.name,
                price: plan.price,
                maxBuses: plan.maxBuses,
                maxDrivers: plan.maxDrivers,
                maxStudents: plan.maxStudents,
                subscriptionFees: plan.subscriptionFees,
                minSubscriptionFeesPay: plan.minSubscriptionFeesPay,
            });
        }
        console.log(`   📝 Inserted ${defaultPlans.length} subscription plans`);
    },
    async rollback() {
        await db_1.db.delete(schema_1.plans).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
