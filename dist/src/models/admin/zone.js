"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zones = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../schema");
exports.zones = (0, mysql_core_1.mysqlTable)("zones", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => schema_1.organizations.id),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    cityId: (0, mysql_core_1.char)("city_id", { length: 36 }).notNull().references(() => schema_1.cities.id),
    cost: (0, mysql_core_1.int)("cost").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
});
