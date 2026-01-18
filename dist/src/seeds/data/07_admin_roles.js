"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const defaultRoles = [
    {
        name: "Full Access",
        permissions: [
            { module: "admins", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "roles", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "bus_types", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "buses", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "drivers", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "codrivers", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "pickup_points", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "routes", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "rides", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "notes", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }] },
            { module: "reports", actions: [{ action: "View" }] },
            { module: "settings", actions: [{ action: "View" }, { action: "Edit" }] },
        ],
    },
    {
        name: "Driver Manager",
        permissions: [
            { module: "drivers", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "codrivers", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "buses", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }, { action: "Status" }] },
            { module: "routes", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }] },
            { module: "rides", actions: [{ action: "View" }] },
        ],
    },
    {
        name: "Student Manager",
        permissions: [
            { module: "pickup_points", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }] },
            { module: "routes", actions: [{ action: "View" }] },
            { module: "rides", actions: [{ action: "View" }] },
            { module: "notes", actions: [{ action: "View" }, { action: "Add" }, { action: "Edit" }, { action: "Delete" }] },
        ],
    },
    {
        name: "Read Only",
        permissions: [
            { module: "admins", actions: [{ action: "View" }] },
            { module: "roles", actions: [{ action: "View" }] },
            { module: "buses", actions: [{ action: "View" }] },
            { module: "drivers", actions: [{ action: "View" }] },
            { module: "codrivers", actions: [{ action: "View" }] },
            { module: "routes", actions: [{ action: "View" }] },
            { module: "rides", actions: [{ action: "View" }] },
            { module: "reports", actions: [{ action: "View" }] },
        ],
    },
];
const seed = {
    name: "07_admin_roles",
    async run() {
        console.log("   📝 Inserting admin roles...");
        for (const role of defaultRoles) {
            await db_1.db.insert(schema_1.roles).values({
                name: role.name,
                permissions: role.permissions,
                status: "active",
            });
        }
        console.log(`   📝 Inserted ${defaultRoles.length} admin roles`);
    },
    async rollback() {
        await db_1.db.delete(schema_1.roles).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
