"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const defaultRoles = [
    {
        name: "Full Access",
        permissions: [
            {
                module: "organizations",
                actions: [
                    { action: "create" },
                    { action: "read" },
                    { action: "update" },
                    { action: "delete" },
                ],
            },
            {
                module: "subscriptions",
                actions: [
                    { action: "create" },
                    { action: "read" },
                    { action: "update" },
                    { action: "delete" },
                ],
            },
            {
                module: "plans",
                actions: [
                    { action: "create" },
                    { action: "read" },
                    { action: "update" },
                    { action: "delete" },
                ],
            },
            {
                module: "payments",
                actions: [
                    { action: "create" },
                    { action: "read" },
                    { action: "update" },
                    { action: "delete" },
                ],
            },
            {
                module: "sub_admins",
                actions: [
                    { action: "create" },
                    { action: "read" },
                    { action: "update" },
                    { action: "delete" },
                ],
            },
        ],
    },
    {
        name: "Read Only",
        permissions: [
            { module: "organizations", actions: [{ action: "read" }] },
            { module: "subscriptions", actions: [{ action: "read" }] },
            { module: "plans", actions: [{ action: "read" }] },
            { module: "payments", actions: [{ action: "read" }] },
        ],
    },
    {
        name: "Organization Manager",
        permissions: [
            {
                module: "organizations",
                actions: [
                    { action: "create" },
                    { action: "read" },
                    { action: "update" },
                ],
            },
            {
                module: "subscriptions",
                actions: [
                    { action: "create" },
                    { action: "read" },
                    { action: "update" },
                ],
            },
        ],
    },
];
const seed = {
    name: "01_super_admin_roles",
    async run() {
        console.log("   📝 Inserting super admin roles...");
        for (const role of defaultRoles) {
            await db_1.db.insert(schema_1.superAdminRoles).values({
                name: role.name,
                permissions: role.permissions,
                status: "active",
            });
        }
        console.log(`   📝 Inserted ${defaultRoles.length} super admin roles`);
    },
    async rollback() {
        await db_1.db.delete(schema_1.superAdminRoles).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
