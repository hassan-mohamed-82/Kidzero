import { db } from "../../models/db";
import { superAdmins } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import "dotenv/config";

const seed: Seed = {
    name: "02_super_admins",

    async run() {
        console.log("   📝 Inserting super admin...");

        const password = process.env.SUPER_ADMIN_PASSWORD || "admin123";
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.insert(superAdmins).values({
            name: process.env.SUPER_ADMIN_NAME || "Super Admin",
            email: process.env.SUPER_ADMIN_EMAIL || "admin@kidzero.com",
            passwordHashed: hashedPassword,
            role: "superadmin",
            status: "active",
        });

        console.log("   📝 Inserted 1 super admin");
    },

    async rollback() {
        await db.delete(superAdmins).where(sql`1=1`);
    },
};

export default seed;
