"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeds = void 0;
// Auto-discover and register all seed files
// Import all seed files in order
const _01_super_admin_roles_1 = __importDefault(require("./data/01_super_admin_roles"));
const _02_super_admins_1 = __importDefault(require("./data/02_super_admins"));
const _03_organization_types_1 = __importDefault(require("./data/03_organization_types"));
const _04_plans_1 = __importDefault(require("./data/04_plans"));
const _05_bus_types_1 = __importDefault(require("./data/05_bus_types"));
const _06_payment_methods_1 = __importDefault(require("./data/06_payment_methods"));
const _07_admin_roles_1 = __importDefault(require("./data/07_admin_roles"));
// import cities from "./data/08_cities";
const _09_promocodes_1 = __importDefault(require("./data/09_promocodes"));
// Export all seeds in execution order
exports.seeds = [
    _01_super_admin_roles_1.default,
    _02_super_admins_1.default,
    _03_organization_types_1.default,
    _04_plans_1.default,
    _05_bus_types_1.default,
    _06_payment_methods_1.default,
    _07_admin_roles_1.default,
    //cities,
    _09_promocodes_1.default,
];
// Run seeds when this file is executed directly
const runner_1 = require("./runner");
const isFresh = process.argv.includes("--fresh");
(0, runner_1.runSeeds)(exports.seeds, { fresh: isFresh })
    .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
})
    .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});
