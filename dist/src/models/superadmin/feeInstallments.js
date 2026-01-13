"use strict";
// src/models/superadmin/feeInstallments.ts
// Tracks subscription fee installment payments for organizations
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeInstallments = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const organization_1 = require("./organization");
const subscribtion_1 = require("./subscribtion");
exports.feeInstallments = (0, mysql_core_1.mysqlTable)("fee_installments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    // Link to subscription and organization
    subscriptionId: (0, mysql_core_1.char)("subscription_id", { length: 36 })
        .notNull().references(() => subscribtion_1.subscriptions.id),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 })
        .notNull().references(() => organization_1.organizations.id),
    // Total fee tracking for this subscription period
    totalFeeAmount: (0, mysql_core_1.double)("total_fee_amount").notNull(), // Full subscription fees from plan
    paidAmount: (0, mysql_core_1.double)("paid_amount").notNull().default(0), // Sum of all approved payments so far
    remainingAmount: (0, mysql_core_1.double)("remaining_amount").notNull(), // totalFeeAmount - paidAmount
    // Current installment details
    installmentAmount: (0, mysql_core_1.double)("installment_amount").notNull(), // Amount for THIS payment
    dueDate: (0, mysql_core_1.timestamp)("due_date"), // When this installment is due (null for immediate)
    // Status tracking
    status: (0, mysql_core_1.mysqlEnum)("status", [
        "pending", // Awaiting super admin approval
        "approved", // Approved, payment recorded
        "rejected", // Rejected by super admin
        "overdue" // Past due date, not paid
    ]).notNull().default("pending"),
    rejectedReason: (0, mysql_core_1.varchar)("rejected_reason", { length: 255 }),
    // Payment proof
    receiptImage: (0, mysql_core_1.varchar)("receipt_image", { length: 500 }),
    // Installment sequence number
    installmentNumber: (0, mysql_core_1.int)("installment_number").notNull().default(1),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
