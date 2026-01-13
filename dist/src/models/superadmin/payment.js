"use strict";
// src/models/schema/payment.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.payment = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const organization_1 = require("./organization");
const plan_1 = require("./plan");
const promocodes_1 = require("./promocodes");
const paymentMethod_1 = require("./paymentMethod");
exports.payment = (0, mysql_core_1.mysqlTable)("payments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => organization_1.organizations.id),
    planId: (0, mysql_core_1.char)("plan_id", { length: 36 }).notNull().references(() => plan_1.plans.id),
    paymentMethodId: (0, mysql_core_1.char)("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod_1.paymentMethod.id),
    amount: (0, mysql_core_1.double)("amount").notNull(),
    // ✅ صورة الإيصال
    receiptImage: (0, mysql_core_1.varchar)("receipt_image", { length: 500 }).notNull(),
    promocodeId: (0, mysql_core_1.char)("promocode_id", { length: 36 }).references(() => promocodes_1.promocode.id),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
    rejectedReason: (0, mysql_core_1.varchar)("rejected_reason", { length: 255 }),
    RequestedSubscriptionType: (0, mysql_core_1.mysqlEnum)("requested_subscription_type", ["yearly", "semester"]).notNull().default("semester"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
