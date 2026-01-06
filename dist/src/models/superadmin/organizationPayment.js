"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationPayment = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const organization_1 = require("./organization");
const drizzle_orm_1 = require("drizzle-orm");
exports.organizationPayment = (0, mysql_core_1.mysqlTable)("organization_payments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => organization_1.organizations.id),
    paymentId: (0, mysql_core_1.char)("payment_id", { length: 36 }).notNull().references(() => organization_1.organizations.id),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
