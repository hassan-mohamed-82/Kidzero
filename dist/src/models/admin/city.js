"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cities = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.cities = (0, mysql_core_1.mysqlTable)("cities", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
});
