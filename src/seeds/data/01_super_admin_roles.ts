import { db } from "../../models/db";
import { superAdminRoles, SuperAdminPermission } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";

const defaultRoles: {
    name: string;
    permissions: SuperAdminPermission[];
}[] = [
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

const seed: Seed = {
    name: "01_super_admin_roles",

    async run() {
        console.log("   📝 Inserting super admin roles...");

        for (const role of defaultRoles) {
            await db.insert(superAdminRoles).values({
                name: role.name,
                permissions: role.permissions,
                status: "active",
            });
        }

        console.log(`   📝 Inserted ${defaultRoles.length} super admin roles`);
    },

    async rollback() {
        await db.delete(superAdminRoles).where(sql`1=1`);
    },
};

export default seed;
