import { mysqlTable, char, double, timestamp, mysqlEnum, date, int } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { parentServicesSubscriptions } from "./parentServicesSubscription";
import { parentPaymentOrgServices } from "./parentPaymentServices";
import { organizationServices } from "./organizationServices";

export const servicePaymentInstallments = mysqlTable("service_payment_installments", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    subscriptionId: char("subscription_id", { length: 36 }).notNull().references(() => parentServicesSubscriptions.id),
    serviceId: char("service_id", { length: 36 }).notNull().references(() => organizationServices.id),
    dueDate: date("due_date").notNull(),
    amount: double("amount").notNull(), // Base amount for this installment

    status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).notNull().default("pending"),

    paidAmount: double("paid_amount").default(0),
    fineAmount: double("fine_amount").default(0),
    discountAmount: double("discount_amount").default(0),

    transactionId: char("transaction_id", { length: 36 }).references(() => parentPaymentOrgServices.id), // Link to actual payment

    numberOfInstallmentsRequested: int("number_of_installments").notNull().default(0),
    numberOfInstallmentsPaid: int("number_of_installments_paid").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
