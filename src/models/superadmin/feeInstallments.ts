// src/models/superadmin/feeInstallments.ts
// Tracks subscription fee installment payments for organizations

import { mysqlTable, char, double, timestamp, mysqlEnum, int, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { organizations } from "./organization";
import { subscriptions } from "./subscribtion";
import { paymentMethod } from "./paymentMethod";

export const feeInstallments = mysqlTable("fee_installments", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),

  // Link to subscription and organization
  subscriptionId: char("subscription_id", { length: 36 })
    .notNull().references(() => subscriptions.id),
  organizationId: char("organization_id", { length: 36 })
    .notNull().references(() => organizations.id),

  // Payment method used for this installment
  paymentMethodId: char("payment_method_id", { length: 36 })
    .notNull().references(() => paymentMethod.id),

  // Total fee tracking for this subscription period
  totalFeeAmount: double("total_fee_amount").notNull(),     // Full subscription fees from plan
  paidAmount: double("paid_amount").notNull().default(0),   // Sum of all approved payments so far
  remainingAmount: double("remaining_amount").notNull(),    // totalFeeAmount - paidAmount

  // Current installment details
  installmentAmount: double("installment_amount").notNull(), // Amount for THIS payment
  dueDate: timestamp("due_date"),                            // When this installment is due (null for immediate)

  // Status tracking
  status: mysqlEnum("status", [
    "pending",      // Awaiting super admin approval
    "approved",     // Approved, payment recorded
    "rejected",     // Rejected by super admin
    "overdue"       // Past due date, not paid
  ]).notNull().default("pending"),

  rejectedReason: varchar("rejected_reason", { length: 255 }),

  // Payment proof
  receiptImage: varchar("receipt_image", { length: 500 }),

  // Installment sequence number
  installmentNumber: int("installment_number").notNull().default(1),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
