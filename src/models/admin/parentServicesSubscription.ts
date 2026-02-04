import { boolean, date, int, mysqlTable, timestamp, varchar, char, double, mysqlEnum } from "drizzle-orm/mysql-core";
import { organizationServices } from "./organizationServices";
import { parents } from "../admin/parent";
import { parentPaymentOrgServices } from "./parentPaymentServices";
import { sql } from "drizzle-orm";
import { students } from "./student";
export const parentServicesSubscriptions = mysqlTable("parent__services_subscriptions", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    parentId: char("parent_id", { length: 36 }).notNull().references(() => parents.id),
    studentId: char("student_id", { length: 36 }).notNull().references(() => students.id),
    serviceId: char("service_id", { length: 36 }).notNull().references(() => organizationServices.id),
    parentServicePaymentId: char("parent_service_payment_id", { length: 36 }).notNull().references(() => parentPaymentOrgServices.id),
    isActive: boolean("is_active").notNull().default(true),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),

    paymentType: mysqlEnum("payment_type", ["onetime", "installment"]).default("onetime"),
    totalAmount: double("total_amount").notNull().default(0),
    outstandingAmount: double("outstanding_amount").notNull().default(0),


    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});