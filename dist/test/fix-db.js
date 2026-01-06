"use strict";
// fix-db.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function fixDatabase() {
    const connection = await promise_1.default.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "bus",
    });
    try {
        console.log("🔄 جاري إصلاح الداتابيز...");
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");
        // جلب كل الجداول
        const [tables] = await connection.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'bus'
        `);
        // حذف كل الجداول
        for (const table of tables) {
            const tableName = table.TABLE_NAME || table.table_name;
            await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`🗑️ حذف: ${tableName}`);
        }
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("✅ تم حذف كل الجداول!");
    }
    catch (error) {
        console.error("❌ خطأ:", error);
    }
    finally {
        await connection.end();
    }
}
fixDatabase();
