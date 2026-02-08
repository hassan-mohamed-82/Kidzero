"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentServicesSubscriptions = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const organizationServices_1 = require("./organizationServices");
const parent_1 = require("../admin/parent");
const parentPaymentServices_1 = require("./parentPaymentServices");
const drizzle_orm_1 = require("drizzle-orm");
const student_1 = require("./student");
exports.parentServicesSubscriptions = (0, mysql_core_1.mysqlTable)("parent__services_subscriptions", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    parentId: (0, mysql_core_1.char)("parent_id", { length: 36 }).notNull().references(() => parent_1.parents.id),
    studentId: (0, mysql_core_1.char)("student_id", { length: 36 }).notNull().references(() => student_1.students.id),
    serviceId: (0, mysql_core_1.char)("service_id", { length: 36 }).notNull().references(() => organizationServices_1.organizationServices.id),
    parentServicePaymentId: (0, mysql_core_1.char)("parent_service_payment_id", { length: 36 }).notNull().references(() => parentPaymentServices_1.parentPaymentOrgServices.id),
    isActive: (0, mysql_core_1.boolean)("is_active").notNull().default(true),
    startDate: (0, mysql_core_1.date)("start_date").notNull(),
    endDate: (0, mysql_core_1.date)("end_date").notNull(),
    paymentType: (0, mysql_core_1.mysqlEnum)("payment_type", ["onetime", "installment"]).default("onetime"),
    totalAmount: (0, mysql_core_1.double)("total_amount").notNull().default(0),
    currentPaid: (0, mysql_core_1.double)("current_paid").notNull().default(0),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
