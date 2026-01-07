import { relations } from "drizzle-orm";
import { organizations, organizationTypes, buses, rides } from "../schema";
// import { students } from "./student";

// 1. Organization Relations
export const organizationRelations = relations(organizations, ({ one, many }) => ({
  // An organization "has one" type
  organizationType: one(organizationTypes, {
    fields: [organizations.organizationTypeId],
    references: [organizationTypes.id],
  }),
  // An organization "has many" buses
  buses: many(buses),
  // An organization "has many" rides
  rides: many(rides),
  // An organization "has many" students (Assuming you have a students table)
  // students: many(students), 
}));

// 2. Organization Type Relations (Inverse)
export const organizationTypeRelations = relations(organizationTypes, ({ many }) => ({
  organizations: many(organizations),
}));

// 3. Bus Relations (Inverse)
export const busRelations = relations(buses, ({ one }) => ({
  organization: one(organizations, {
    fields: [buses.organizationId],
    references: [organizations.id],
  }),
}));

// 4. Ride Relations (Inverse)
export const rideRelations = relations(rides, ({ one }) => ({
  organization: one(organizations, {
    fields: [rides.organizationId],
    references: [organizations.id],
  }),
}));