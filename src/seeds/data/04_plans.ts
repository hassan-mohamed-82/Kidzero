import { db } from "../../models/db";
import { plans } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";


const seed: Seed = {
    name: "04_plans",

    async run() {
        console.log("   📝 Inserting subscription plans...");

        const defaultPlans = [
            {
                name: "Basic Plan",
                price: 500,
                maxBuses: 5,
                maxDrivers: 10,
                maxStudents: 50,
                subscriptionFees: 100,
                minSubscriptionFeesPay: 50,
            },
            {
                name: "Standard Plan",
                price: 1000,
                maxBuses: 15,
                maxDrivers: 30,
                maxStudents: 200,
                subscriptionFees: 200,
                minSubscriptionFeesPay: 100,
            },
            {
                name: "Premium Plan",
                price: 2000,
                maxBuses: 50,
                maxDrivers: 100,
                maxStudents: 500,
                subscriptionFees: 300,
                minSubscriptionFeesPay: 150,
            },
            {
                name: "Enterprise Plan",
                price: 5000,
                maxBuses: 200,
                maxDrivers: 400,
                maxStudents: 2000,
                subscriptionFees: 500,
                minSubscriptionFeesPay: 250,
            },
        ];

        for (const plan of defaultPlans) {
            await db.insert(plans).values({
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
        await db.delete(plans).where(sql`1=1`);
    },
};

export default seed;
