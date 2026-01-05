import { char, mysqlTable, varchar, text, timestamp, int } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const promocode = mysqlTable("promocodes", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 30 }).notNull(),
    amount: int("amount").notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
});
//# sourceMappingURL=promocodes.js.map