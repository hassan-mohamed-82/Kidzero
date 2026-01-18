"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
require("dotenv/config");
const seed = {
    name: "02_super_admins",
    async run() {
        console.log("   📝 Inserting super admin...");
        const password = process.env.SUPER_ADMIN_PASSWORD || "admin123";
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await db_1.db.insert(schema_1.superAdmins).values({
            name: process.env.SUPER_ADMIN_NAME || "Super Admin",
            email: process.env.SUPER_ADMIN_EMAIL || "admin@kidzero.com",
            passwordHashed: hashedPassword,
            role: "superadmin",
            status: "active",
        });
        console.log("   📝 Inserted 1 super admin");
    },
    async rollback() {
        await db_1.db.delete(schema_1.superAdmins).where((0, drizzle_orm_1.sql) `1=1`);
    },
};
exports.default = seed;
