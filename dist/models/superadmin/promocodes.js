"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promocode = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.promocode = (0, mysql_core_1.mysqlTable)("promocodes", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    code: (0, mysql_core_1.varchar)("code", { length: 30 }).notNull().unique(),
    amount: (0, mysql_core_1.int)("amount").notNull(),
    promocodeType: (0, mysql_core_1.mysqlEnum)("promocode_type", ["percentage", "amount"]).notNull(),
    description: (0, mysql_core_1.text)("description").notNull(),
    startDate: (0, mysql_core_1.timestamp)("start_date").notNull(),
    endDate: (0, mysql_core_1.timestamp)("end_date").notNull(),
});
