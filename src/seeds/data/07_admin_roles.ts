import { db } from "../../models/db";
import { roles } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";
import { Permission } from "../../types/custom";

const defaultRoles: {
    name: string;
    permissions: Permission[];
}[] = [
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

const seed: Seed = {
    name: "07_admin_roles",

    async run() {
        console.log("   📝 Inserting admin roles...");

        for (const role of defaultRoles) {
            await db.insert(roles).values({
                name: role.name,
                permissions: role.permissions,
                status: "active",
            });
        }

        console.log(`   📝 Inserted ${defaultRoles.length} admin roles`);
    },

    async rollback() {
        await db.delete(roles).where(sql`1=1`);
    },
};

export default seed;
