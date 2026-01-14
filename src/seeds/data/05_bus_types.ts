import { db } from "../../models/db";
import { busTypes } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";

const defaultBusTypes = [
    { name: "Mini Bus", capacity: 14, description: "Small bus for short routes" },
    {
        name: "Standard Bus",
        capacity: 30,
        description: "Regular school bus for medium routes",
    },
    {
        name: "Large Bus",
        capacity: 50,
        description: "Large bus for long routes",
    },
    { name: "Van", capacity: 8, description: "Small van for special pickups" },
    {
        name: "Luxury Bus",
        capacity: 25,
        description: "Premium bus with extra amenities",
    },
];

const seed: Seed = {
    name: "05_bus_types",

    async run() {
        console.log("   📝 Inserting bus types...");

        for (const busType of defaultBusTypes) {
            await db.insert(busTypes).values({
                name: busType.name,
                capacity: busType.capacity,
                description: busType.description,
                status: "active",
            });
        }

        console.log(`   📝 Inserted ${defaultBusTypes.length} bus types`);
    },

    async rollback() {
        await db.delete(busTypes).where(sql`1=1`);
    },
};

export default seed;
