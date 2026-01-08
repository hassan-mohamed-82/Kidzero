"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethod = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const mysql_core_2 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const mysql_core_3 = require("drizzle-orm/mysql-core");
exports.paymentMethod = (0, mysql_core_2.mysqlTable)("payment_methods", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_2.varchar)("name", { length: 100 }).notNull(),
    description: (0, mysql_core_2.varchar)("description", { length: 255 }),
    logo: (0, mysql_core_2.varchar)("logo", { length: 500 }).notNull(),
    isActive: (0, mysql_core_2.boolean)("is_active").notNull().default(true),
    feeStatus: (0, mysql_core_2.boolean)("fee_status").notNull().default(true),
    feeAmount: (0, mysql_core_3.double)("fee_amount").notNull().default(0),
});
