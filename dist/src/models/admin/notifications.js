"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = void 0;
// src/models/schema/notification.ts
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.notifications = (0, mysql_core_1.mysqlTable)("notifications", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    userId: (0, mysql_core_1.char)("user_id", { length: 36 }).notNull(),
    userType: (0, mysql_core_1.mysqlEnum)("user_type", ["parent", "driver", "admin"]).notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    body: (0, mysql_core_1.text)("body").notNull(),
    type: (0, mysql_core_1.varchar)("type", { length: 50 }).notNull(),
    data: (0, mysql_core_1.text)("data"),
    isRead: (0, mysql_core_1.boolean)("is_read").default(false),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    userIdIdx: (0, mysql_core_1.index)("user_id_idx").on(table.userId),
    userTypeIdx: (0, mysql_core_1.index)("user_type_idx").on(table.userType),
    isReadIdx: (0, mysql_core_1.index)("is_read_idx").on(table.isRead),
}));
