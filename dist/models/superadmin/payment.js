"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payment = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const plan_1 = require("./plan");
const promocodes_1 = require("./promocodes");
const paymentMethod_1 = require("./paymentMethod");
exports.payment = (0, mysql_core_1.mysqlTable)("payments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    planId: (0, mysql_core_1.char)("plan_id", { length: 36 }).notNull().references(() => plan_1.plans.id),
    paymentMethodId: (0, mysql_core_1.char)("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod_1.paymentMethod.id),
    amount: (0, mysql_core_1.double)("amount").notNull(),
    rejectedReason: (0, mysql_core_1.varchar)("rejected_reason", { length: 255 }),
    promocodeId: (0, mysql_core_1.char)("promocode_id", { length: 36 }).references(() => promocodes_1.promocode.id),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
});
