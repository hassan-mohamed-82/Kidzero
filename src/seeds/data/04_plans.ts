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
