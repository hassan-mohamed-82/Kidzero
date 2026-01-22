"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentPaymentOrgServices = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const parent_1 = require("../admin/parent");
const organizationServices_1 = require("./organizationServices");
const paymentMethod_1 = require("../superadmin/paymentMethod");
exports.parentPaymentOrgServices = (0, mysql_core_1.mysqlTable)("parent_payment_org_services", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    parentId: (0, mysql_core_1.char)("parent_id", { length: 36 }).notNull().references(() => parent_1.parents.id),
    ServiceId: (0, mysql_core_1.char)("service_id", { length: 36 }).notNull().references(() => organizationServices_1.organizationServices.id),
    paymentMethodId: (0, mysql_core_1.char)("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod_1.paymentMethod.id),
    amount: (0, mysql_core_1.double)("amount").notNull(),
    receiptImage: (0, mysql_core_1.varchar)("receipt_image", { length: 500 }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
    rejectedReason: (0, mysql_core_1.varchar)("rejected_reason", { length: 255 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
