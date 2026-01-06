"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plans = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const sql_1 = require("drizzle-orm/sql");
exports.plans = (0, mysql_core_1.mysqlTable)("plan", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, sql_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    price_semester: (0, mysql_core_1.double)("price_semester").notNull().default(0),
    price_year: (0, mysql_core_1.double)("price_year").notNull().default(0),
    maxBuses: (0, mysql_core_1.int)("max_buses").default(10),
    maxDrivers: (0, mysql_core_1.int)("max_drivers").default(20),
    maxStudents: (0, mysql_core_1.int)("max_students").default(100),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
