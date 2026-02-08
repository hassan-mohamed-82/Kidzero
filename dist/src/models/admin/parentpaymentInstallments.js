"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentPaymentInstallments = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const paymentMethod_1 = require("../superadmin/paymentMethod");
const schema_1 = require("../schema");
const schema_2 = require("../schema");
exports.parentPaymentInstallments = (0, mysql_core_1.mysqlTable)("parent_payment_installments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    installmentId: (0, mysql_core_1.char)("installment_id", { length: 36 }).notNull().references(() => schema_1.servicePaymentInstallments.id),
    paymentMethodId: (0, mysql_core_1.char)("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod_1.paymentMethod.id),
    receiptImage: (0, mysql_core_1.varchar)("receipt_image", { length: 255 }).notNull(),
    paidAmount: (0, mysql_core_1.double)("amount").notNull(),
    parentId: (0, mysql_core_1.char)("parent_id", { length: 36 }).notNull().references(() => schema_2.parents.id),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
    rejectedReason: (0, mysql_core_1.varchar)("rejected_reason", { length: 255 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
