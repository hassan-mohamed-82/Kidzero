import { mysqlTable, char, double, varchar, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { paymentMethod } from "../superadmin/paymentMethod";
import { servicePaymentInstallments } from "../schema";
import { parents } from "../schema";

export const parentPaymentInstallments = mysqlTable("parent_payment_installments", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    installmentId: char("installment_id", { length: 36 }).notNull().references(() => servicePaymentInstallments.id),
    paymentMethodId: char("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod.id),
    receiptImage: varchar("receipt_image", { length: 255 }).notNull(),
    paidAmount: double("amount").notNull(),
    parentId: char("parent_id", { length: 36 }).notNull().references(() => parents.id),
    status: mysqlEnum("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
    rejectedReason: varchar("rejected_reason", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});