"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUsedPromocodes = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const schema_1 = require("../schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.adminUsedPromocodes = (0, mysql_core_1.mysqlTable)("admin_promocodes", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => schema_1.organizations.id),
    promocodeId: (0, mysql_core_1.char)("promocode_id", { length: 36 }).notNull().references(() => schema_1.promocode.id),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
});
