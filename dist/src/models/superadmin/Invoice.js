"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoice = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const schema_1 = require("../schema");
const mysql_core_2 = require("drizzle-orm/mysql-core");
const sql_1 = require("drizzle-orm/sql");
exports.invoice = (0, mysql_core_1.mysqlTable)("invoices", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, sql_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => schema_1.organizations.id),
    subscriptionId: (0, mysql_core_1.char)("subscription_id", { length: 36 }).notNull().references(() => schema_1.subscriptions.id),
    amount: (0, mysql_core_1.double)("amount", { precision: 10, scale: 2 }).notNull(),
    planId: (0, mysql_core_1.char)("plan_id", { length: 36 }).notNull().references(() => schema_1.plans.id),
    issuedAt: (0, mysql_core_1.timestamp)("issued_at").defaultNow(),
    dueAt: (0, mysql_core_1.timestamp)("due_at").notNull(),
    paidAt: (0, mysql_core_1.timestamp)("paid_at"),
    status: (0, mysql_core_2.mysqlEnum)("status", ["pending", "paid", "overdue"]).notNull().default("pending"),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
