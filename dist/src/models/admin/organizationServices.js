"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationServices = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const organization_1 = require("../superadmin/organization");
const drizzle_orm_1 = require("drizzle-orm");
exports.organizationServices = (0, mysql_core_1.mysqlTable)("organization_services", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => organization_1.organizations.id),
    serviceName: (0, mysql_core_1.varchar)("service_name", { length: 255 }).notNull(),
    serviceDescription: (0, mysql_core_1.varchar)("service_description", { length: 255 }).notNull(),
    useZonePricing: (0, mysql_core_1.boolean)("use_zone_pricing").notNull().default(true),
    servicePrice: (0, mysql_core_1.double)("service_price").notNull().default(0),
    // Installment configuration
    allowInstallments: (0, mysql_core_1.boolean)("allow_installments").notNull().default(false),
    maxInstallmentDates: (0, mysql_core_1.int)("max_installment_dates").default(0),
    earlyPaymentDiscount: (0, mysql_core_1.double)("early_payment_discount").default(0), // Percentage -- Optional
    latePaymentFine: (0, mysql_core_1.double)("late_payment_fine").default(0), // Percentage -- Optional
    dueDay: (0, mysql_core_1.int)("due_day").default(5), // Default due day of the month
    createdAt: (0, mysql_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").notNull().defaultNow().onUpdateNow(),
});
