import { Seed } from "./runner";

// Auto-discover and register all seed files
// Import all seed files in order
import superAdminRoles from "./data/01_super_admin_roles";
import superAdmins from "./data/02_super_admins";
import organizationTypes from "./data/03_organization_types";
import plans from "./data/04_plans";
import busTypes from "./data/05_bus_types";
import paymentMethods from "./data/06_payment_methods";
import adminRoles from "./data/07_admin_roles";
import cities from "./data/08_cities";
import promocodes from "./data/09_promocodes";

// Export all seeds in execution order
export const seeds: Seed[] = [
  superAdminRoles,
  superAdmins,
  organizationTypes,
  plans,
  busTypes,
  paymentMethods,
  adminRoles,
  cities,
  promocodes,
];

// Run seeds when this file is executed directly
import { runSeeds } from "./runner";

const isFresh = process.argv.includes("--fresh");

runSeeds(seeds, { fresh: isFresh })
  .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
