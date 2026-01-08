"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRelations = exports.rideRelations = exports.busRelations = exports.organizationTypeRelations = exports.organizationRelations = void 0;
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
