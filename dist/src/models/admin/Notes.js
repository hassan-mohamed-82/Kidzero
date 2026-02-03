"use strict";
// src/models/schema/note.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.notes = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.notes = (0, mysql_core_1.mysqlTable)("notes", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    date: (0, mysql_core_1.date)("date").notNull(),
    type: (0, mysql_core_1.mysqlEnum)("type", ["holiday", "event", "other"]).default("holiday"),
    cancelRides: (0, mysql_core_1.boolean)("cancel_rides").default(true),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "cancelled"]).default("active"),
    createdBy: (0, mysql_core_1.char)("created_by", { length: 36 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
    uniqueOrgDateType: (0, mysql_core_1.uniqueIndex)("unique_org_date_type").on(table.organizationId, table.date, table.type),
}));
