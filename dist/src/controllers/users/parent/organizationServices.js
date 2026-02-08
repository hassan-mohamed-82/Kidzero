"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSubscribedServices = exports.getAllAvailableOrganizationServices = void 0;
const db_1 = require("../../../models/db");
const response_1 = require("../../../utils/response");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../../Errors/BadRequest");
const getAllAvailableOrganizationServices = async (req, res) => {
    const studentId = req.params.studentId;
    if (!studentId) {
        throw new BadRequest_1.BadRequest("Student ID is required");
    }
    // We perform a join starting from the Services table.
    // 1. Join Students to ensure we only get services for their Organization.
    // 2. Join Zones to get the cost associated with that Student's zone.
    const orgServices = await db_1.db
        .select({
        id: schema_1.organizationServices.id,
        serviceName: schema_1.organizationServices.serviceName,
        serviceDescription: schema_1.organizationServices.serviceDescription,
        baseServicePrice: schema_1.organizationServices.servicePrice, // The default price
        useZonePricing: schema_1.organizationServices.useZonePricing,
        // Installment info
        allowInstallments: schema_1.organizationServices.allowInstallments,
        maxInstallmentDates: schema_1.organizationServices.maxInstallmentDates,
        earlyPaymentDiscount: schema_1.organizationServices.earlyPaymentDiscount,
        latePaymentFine: schema_1.organizationServices.latePaymentFine,
        dueDay: schema_1.organizationServices.dueDay,
        // The cost of the zone the student belongs to
        studentZoneCost: schema_1.zones.cost,
        // CALCULATED FIELD: The final price the user sees
        finalPrice: (0, drizzle_orm_1.sql) `
                CASE 
                    WHEN ${schema_1.organizationServices.useZonePricing} = true THEN ${schema_1.zones.cost}
                    ELSE ${schema_1.organizationServices.servicePrice}
                END`
    })
        .from(schema_1.organizationServices)
        // Join Student to filter services by the Student's Organization
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.organizationServices.organizationId, schema_1.students.organizationId))
        // Join Zones to get the cost for the Student's specific Zone
        .innerJoin(schema_1.zones, (0, drizzle_orm_1.eq)(schema_1.students.zoneId, schema_1.zones.id))
        // Filter by the specific Student ID provided in params
        .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
    return (0, response_1.SuccessResponse)(res, {
        message: "Available Organization Services retrieved successfully",
        orgServices
    }, 200);
};
exports.getAllAvailableOrganizationServices = getAllAvailableOrganizationServices;
const getCurrentSubscribedServices = async (req, res) => {
    const studentId = req.params.studentId;
    if (!studentId) {
        throw new BadRequest_1.BadRequest("Student ID is required");
    }
    const currentSubscribedServicesForStudent = await db_1.db
        .select()
        .from(schema_1.parentServicesSubscriptions)
        .where((0, drizzle_orm_1.eq)(schema_1.parentServicesSubscriptions.studentId, studentId));
    return (0, response_1.SuccessResponse)(res, {
        message: "Current subscribed services retrieved successfully",
        currentSubscribedServicesForStudent
    }, 200);
};
exports.getCurrentSubscribedServices = getCurrentSubscribedServices;
