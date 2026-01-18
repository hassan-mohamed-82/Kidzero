"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
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
const seed = {
    name: "05_bus_types",
    async run() {
        console.log("   📝 Inserting bus types...");
        for (const busType of defaultBusTypes) {
            await db_1.db.insert(schema_1.busTypes).values({
                name: busType.name,
                capacity: busType.capacity,
                description: busType.description,
                status: "active",
            });
        }
        console.log(`   📝 Inserted ${defaultBusTypes.length} bus types`);
    },
    async rollback() {
        await db_1.db.delete(schema_1.busTypes).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
