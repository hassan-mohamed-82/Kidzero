"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerifications = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.emailVerifications = (0, mysql_core_1.mysqlTable)("email_verifications", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 }).primaryKey(),
    parentId: (0, mysql_core_1.varchar)("parent_id", { length: 36 }).notNull(),
    code: (0, mysql_core_1.varchar)("code", { length: 6 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
});
