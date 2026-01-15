import { relations } from "drizzle-orm";
import { organizations, organizationTypes, buses, rides, students, subscriptions, feeInstallments, organizationServices } from "../schema";


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
  students: many(students),
  // An organization "has many" subscriptions
  subscriptions: many(subscriptions),
  // An organization "has many" fee installments
  feeInstallments: many(feeInstallments),
  // An organization "has many" organization services
  organizationServices: many(organizationServices),
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

export const studentRelations = relations(students, ({ one }) => ({
  organization: one(organizations, {
    fields: [students.organizationId],
    references: [organizations.id],
  }),
}));

// 5. Subscription Relations
export const subscriptionRelations = relations(subscriptions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
  feeInstallments: many(feeInstallments),
}));

// 6. Fee Installment Relations
export const feeInstallmentRelations = relations(feeInstallments, ({ one }) => ({
  organization: one(organizations, {
    fields: [feeInstallments.organizationId],
    references: [organizations.id],
  }),
  subscription: one(subscriptions, {
    fields: [feeInstallments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// 7. Organization Service Relations
export const organizationServiceRelations = relations(organizationServices, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationServices.organizationId],
    references: [organizations.id],
  }),
}));