"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const defaultOrganizationTypes = [
    { name: "School" },
    { name: "Nursery" },
    { name: "Academy" },
    { name: "University" },
    { name: "Training Center" },
];
const seed = {
    name: "03_organization_types",
    async run() {
        console.log("   📝 Inserting organization types...");
        for (const orgType of defaultOrganizationTypes) {
            await db_1.db.insert(schema_1.organizationTypes).values({
                name: orgType.name,
            });
        }
        console.log(`   📝 Inserted ${defaultOrganizationTypes.length} organization types`);
    },
    async rollback() {
        await db_1.db.delete(schema_1.organizationTypes).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
