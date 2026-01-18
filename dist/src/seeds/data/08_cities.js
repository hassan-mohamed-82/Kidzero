"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const defaultCities = [
    { name: "Cairo" },
    { name: "Alexandria" },
    { name: "Giza" },
    { name: "Sharm El Sheikh" },
    { name: "Hurghada" },
    { name: "Luxor" },
    { name: "Aswan" },
    { name: "Port Said" },
    { name: "Suez" },
    { name: "Mansoura" },
    { name: "Tanta" },
    { name: "Ismailia" },
    { name: "Fayoum" },
    { name: "Zagazig" },
    { name: "Damanhour" },
];
const seed = {
    name: "08_cities",
    async run() {
        console.log("   📝 Inserting cities...");
        for (const city of defaultCities) {
            await db_1.db.insert(schema_1.cities).values({
                name: city.name,
            });
        }
        console.log(`   📝 Inserted ${defaultCities.length} cities`);
    },
    async rollback() {
        await db_1.db.delete(schema_1.cities).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
