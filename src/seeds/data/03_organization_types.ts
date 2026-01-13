import { db } from "../../models/db";
import { organizationTypes } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";

const defaultOrganizationTypes = [
    { name: "School" },
    { name: "Nursery" },
    { name: "Academy" },
    { name: "University" },
    { name: "Training Center" },
];

const seed: Seed = {
    name: "03_organization_types",

    async run() {
        console.log("   📝 Inserting organization types...");

        for (const orgType of defaultOrganizationTypes) {
            await db.insert(organizationTypes).values({
                name: orgType.name,
            });
        }

        console.log(
            `   📝 Inserted ${defaultOrganizationTypes.length} organization types`
        );
    },

    async rollback() {
        await db.delete(organizationTypes).where(sql`1=1`);
    },
};

export default seed;
