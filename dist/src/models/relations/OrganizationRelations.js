"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeInstallmentRelations = exports.subscriptionRelations = exports.studentRelations = exports.rideRelations = exports.busRelations = exports.organizationTypeRelations = exports.organizationRelations = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../schema");
// 1. Organization Relations
exports.organizationRelations = (0, drizzle_orm_1.relations)(schema_1.organizations, ({ one, many }) => ({
    // An organization "has one" type
    organizationType: one(schema_1.organizationTypes, {
        fields: [schema_1.organizations.organizationTypeId],
        references: [schema_1.organizationTypes.id],
    }),
    // An organization "has many" buses
    buses: many(schema_1.buses),
    // An organization "has many" rides
    rides: many(schema_1.rides),
    // An organization "has many" students (Assuming you have a students table)
    students: many(schema_1.students),
    // An organization "has many" subscriptions
    subscriptions: many(schema_1.subscriptions),
    // An organization "has many" fee installments
    feeInstallments: many(schema_1.feeInstallments),
}));
// 2. Organization Type Relations (Inverse)
exports.organizationTypeRelations = (0, drizzle_orm_1.relations)(schema_1.organizationTypes, ({ many }) => ({
    organizations: many(schema_1.organizations),
}));
// 3. Bus Relations (Inverse)
exports.busRelations = (0, drizzle_orm_1.relations)(schema_1.buses, ({ one }) => ({
    organization: one(schema_1.organizations, {
        fields: [schema_1.buses.organizationId],
        references: [schema_1.organizations.id],
    }),
}));
// 4. Ride Relations (Inverse)
exports.rideRelations = (0, drizzle_orm_1.relations)(schema_1.rides, ({ one }) => ({
    organization: one(schema_1.organizations, {
        fields: [schema_1.rides.organizationId],
        references: [schema_1.organizations.id],
    }),
}));
exports.studentRelations = (0, drizzle_orm_1.relations)(schema_1.students, ({ one }) => ({
    organization: one(schema_1.organizations, {
        fields: [schema_1.students.organizationId],
        references: [schema_1.organizations.id],
    }),
}));
// 5. Subscription Relations
exports.subscriptionRelations = (0, drizzle_orm_1.relations)(schema_1.subscriptions, ({ one, many }) => ({
    organization: one(schema_1.organizations, {
        fields: [schema_1.subscriptions.organizationId],
        references: [schema_1.organizations.id],
    }),
    feeInstallments: many(schema_1.feeInstallments),
}));
// 6. Fee Installment Relations
exports.feeInstallmentRelations = (0, drizzle_orm_1.relations)(schema_1.feeInstallments, ({ one }) => ({
    organization: one(schema_1.organizations, {
        fields: [schema_1.feeInstallments.organizationId],
        references: [schema_1.organizations.id],
    }),
    subscription: one(schema_1.subscriptions, {
        fields: [schema_1.feeInstallments.subscriptionId],
        references: [schema_1.subscriptions.id],
    }),
}));
