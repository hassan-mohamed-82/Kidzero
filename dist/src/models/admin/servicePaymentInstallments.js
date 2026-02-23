"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicePaymentInstallments = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const parentServicesSubscription_1 = require("./parentServicesSubscription");
const parentPaymentServices_1 = require("./parentPaymentServices");
const organizationServices_1 = require("./organizationServices");
exports.servicePaymentInstallments = (0, mysql_core_1.mysqlTable)("service_payment_installments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    subscriptionId: (0, mysql_core_1.char)("subscription_id", { length: 36 }).notNull().references(() => parentServicesSubscription_1.parentServicesSubscriptions.id),
    serviceId: (0, mysql_core_1.char)("service_id", { length: 36 }).notNull().references(() => organizationServices_1.organizationServices.id),
    dueDate: (0, mysql_core_1.date)("due_date").notNull(),
    amount: (0, mysql_core_1.double)("amount").notNull(), // Base amount for this installment
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "paid", "overdue", "cancelled"]).notNull().default("pending"),
    paidAmount: (0, mysql_core_1.double)("paid_amount").default(0),
    fineAmount: (0, mysql_core_1.double)("fine_amount").default(0),
    discountAmount: (0, mysql_core_1.double)("discount_amount").default(0),
    transactionId: (0, mysql_core_1.char)("transaction_id", { length: 36 }).references(() => parentPaymentServices_1.parentPaymentOrgServices.id), // Link to actual payment
    numberOfInstallmentsRequested: (0, mysql_core_1.int)("number_of_installments").notNull().default(0),
    numberOfInstallmentsPaid: (0, mysql_core_1.int)("number_of_installments_paid").notNull().default(0),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
