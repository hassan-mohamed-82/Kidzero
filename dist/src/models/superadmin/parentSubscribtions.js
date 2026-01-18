"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentSubscriptions = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const parentPlan_1 = require("./parentPlan");
const parent_1 = require("../admin/parent");
const parentpayment_1 = require("./parentpayment");
const drizzle_orm_1 = require("drizzle-orm");
exports.parentSubscriptions = (0, mysql_core_1.mysqlTable)("parent_subscriptions", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    parentId: (0, mysql_core_1.varchar)("parent_id", { length: 255 }).notNull().references(() => parent_1.parents.id),
    parentPlanId: (0, mysql_core_1.varchar)("parent_plan_id", { length: 255 }).notNull().references(() => parentPlan_1.parentPlans.id),
    parentPaymentId: (0, mysql_core_1.varchar)("parent_payment_id", { length: 255 }).notNull().references(() => parentpayment_1.parentPayment.id),
    isActive: (0, mysql_core_1.boolean)("is_active").notNull().default(true),
    startDate: (0, mysql_core_1.date)("start_date").notNull(),
    endDate: (0, mysql_core_1.date)("end_date").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
