
import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  decimal,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { students } from "../admin/student";
import { parents } from "../admin/parent";
import { organizations } from "../superadmin/organization";
import { paymentMethod } from "../superadmin/paymentMethod";


// ✅ جدول طلبات الشحن
export const walletRechargeRequests = mysqlTable("wallet_recharge_requests", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  
  // العلاقات
  organizationId: char("organization_id", { length: 36 })
    .notNull()
    .references(() => organizations.id),
  parentId: char("parent_id", { length: 36 })
    .notNull()
    .references(() => parents.id),
  studentId: char("student_id", { length: 36 })
    .notNull()
    .references(() => students.id),
  
  // تفاصيل الطلب
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethodId: char("payment_method_id", { length: 36 })
    .notNull()
    .references(() => paymentMethod.id),
  
  // إثبات الدفع
  proofImage: varchar("proof_image", { length: 500 }),
  
  // الحالة
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "rejected",
  ]).default("pending"),
  
  // ملاحظة واحدة
  notes: text("notes"),
  
  // Timestamps
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ✅ جدول سجل المعاملات
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  
  organizationId: char("organization_id", { length: 36 })
    .notNull()
    .references(() => organizations.id),
  studentId: char("student_id", { length: 36 })
    .notNull()
    .references(() => students.id),
  
  // نوع العملية
  type: mysqlEnum("type", [
    "recharge",
    "purchase",
  ]).notNull(),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  // مرجع العملية
  referenceId: char("reference_id", { length: 36 }),
  referenceType: varchar("reference_type", { length: 50 }),
  
  description: varchar("description", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});