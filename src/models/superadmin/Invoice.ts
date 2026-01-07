// export const invoice = mysqlTable("invoices", {
//     id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
//     organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),