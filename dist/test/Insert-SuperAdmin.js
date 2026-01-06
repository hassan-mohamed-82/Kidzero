"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/models/db");
const superadmin_1 = require("../src/models/superadmin/superadmin");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function insertSuperAdmin() {
    try {
        console.log("Hashing password...");
        const hashedPassword = await bcrypt_1.default.hash(process.env.SUPER_ADMIN_PASSWORD || "admin123", 10);
        console.log("Inserting super admin...");
        const [result] = await db_1.db.insert(superadmin_1.superAdmins).values({
            name: process.env.SUPER_ADMIN_NAME || "Wego",
            email: process.env.SUPER_ADMIN_EMAIL || "admin@example.com",
            passwordHashed: hashedPassword,
        });
        console.log("✅ Super admin inserted successfully!");
        console.log("Inserted ID:", result.insertId);
    }
    catch (error) {
        console.error("❌ Error inserting super admin:");
        console.error(error.message);
    }
    finally {
        process.exit();
    }
}
insertSuperAdmin();
