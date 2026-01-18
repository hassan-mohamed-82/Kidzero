"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentPlans = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const sql_1 = require("drizzle-orm/sql");
exports.parentPlans = (0, mysql_core_1.mysqlTable)("parent_plan", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, sql_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    price: (0, mysql_core_1.double)("price").notNull().default(0),
    minSubscriptionFeesPay: (0, mysql_core_1.double)("min_subscription_fees_pay").notNull().default(0),
    subscriptionFees: (0, mysql_core_1.double)("subscription_fees").notNull().default(0),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
