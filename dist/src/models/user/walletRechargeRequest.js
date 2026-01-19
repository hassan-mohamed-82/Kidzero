"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletTransactions = exports.walletRechargeRequests = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const student_1 = require("../admin/student");
const parent_1 = require("../admin/parent");
const organization_1 = require("../superadmin/organization");
const paymentMethod_1 = require("../superadmin/paymentMethod");
// ✅ جدول طلبات الشحن
exports.walletRechargeRequests = (0, mysql_core_1.mysqlTable)("wallet_recharge_requests", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    // العلاقات
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 })
        .notNull()
        .references(() => organization_1.organizations.id),
    parentId: (0, mysql_core_1.char)("parent_id", { length: 36 })
        .notNull()
        .references(() => parent_1.parents.id),
    studentId: (0, mysql_core_1.char)("student_id", { length: 36 })
        .notNull()
        .references(() => student_1.students.id),
    // تفاصيل الطلب
    amount: (0, mysql_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethodId: (0, mysql_core_1.char)("payment_methods_id", { length: 36 })
        .notNull()
        .references(() => paymentMethod_1.paymentMethod.id),
    // إثبات الدفع
    proofImage: (0, mysql_core_1.varchar)("proof_image", { length: 500 }),
    // الحالة
    status: (0, mysql_core_1.mysqlEnum)("status", [
        "pending",
        "approved",
        "rejected",
    ]).default("pending"),
    // ملاحظة واحدة
    notes: (0, mysql_core_1.text)("notes"),
    // Timestamps
    reviewedAt: (0, mysql_core_1.timestamp)("reviewed_at"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
// ✅ جدول سجل المعاملات
exports.walletTransactions = (0, mysql_core_1.mysqlTable)("wallet_transactions", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 })
        .notNull()
        .references(() => organization_1.organizations.id),
    studentId: (0, mysql_core_1.char)("student_id", { length: 36 })
        .notNull()
        .references(() => student_1.students.id),
    // نوع العملية
    type: (0, mysql_core_1.mysqlEnum)("type", [
        "recharge",
        "purchase",
    ]).notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    balanceBefore: (0, mysql_core_1.decimal)("balance_before", { precision: 10, scale: 2 }).notNull(),
    balanceAfter: (0, mysql_core_1.decimal)("balance_after", { precision: 10, scale: 2 }).notNull(),
    // مرجع العملية
    referenceId: (0, mysql_core_1.char)("reference_id", { length: 36 }),
    referenceType: (0, mysql_core_1.varchar)("reference_type", { length: 50 }),
    description: (0, mysql_core_1.varchar)("description", { length: 255 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
});
