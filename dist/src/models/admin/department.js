"use strict";
// src/models/schema/driver.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.departments = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.departments = (0, mysql_core_1.mysqlTable)("departments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
});
