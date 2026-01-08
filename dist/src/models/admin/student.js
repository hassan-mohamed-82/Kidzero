"use strict";
// src/models/schema/student.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.students = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const parent_1 = require("./parent");
const schema_1 = require("../schema");
exports.students = (0, mysql_core_1.mysqlTable)("students", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => schema_1.organizations.id),
    parentId: (0, mysql_core_1.char)("parent_id", { length: 36 }).notNull().references(() => parent_1.parents.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    avatar: (0, mysql_core_1.varchar)("avatar", { length: 500 }),
    grade: (0, mysql_core_1.varchar)("grade", { length: 50 }),
    classroom: (0, mysql_core_1.varchar)("classroom", { length: 50 }),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
