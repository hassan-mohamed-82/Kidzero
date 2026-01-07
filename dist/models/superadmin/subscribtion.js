"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptions = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const plan_1 = require("./plan");
const organization_1 = require("./organization");
const drizzle_orm_1 = require("drizzle-orm");
const payment_1 = require("./payment");
exports.subscriptions = (0, mysql_core_1.mysqlTable)("subscriptions", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    planId: (0, mysql_core_1.char)("plan_id", { length: 36 }).notNull().references(() => plan_1.plans.id),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => organization_1.organizations.id),
    startDate: (0, mysql_core_1.timestamp)("start_date").notNull(),
    endDate: (0, mysql_core_1.timestamp)("end_date").notNull(),
    paymentId: (0, mysql_core_1.char)("payment_id", { length: 36 }).notNull().references(() => payment_1.payment.id),
    isActive: (0, mysql_core_1.boolean)("is_active").notNull().default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
