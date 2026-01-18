"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganizationService = exports.createOrganizationService = exports.deleteOrganizationService = exports.getOrganizationServicebyId = exports.getOrganizationServices = void 0;
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const getOrganizationServices = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization Id is required");
    }
    const services = await db_1.db.select().from(schema_1.organizationServices).where((0, drizzle_orm_1.eq)(schema_1.organizationServices.organizationId, organizationId));
    return (0, response_1.SuccessResponse)(res, { message: "Organization Services Fetched Successfully", data: services }, 200);
};
exports.getOrganizationServices = getOrganizationServices;
const getOrganizationServicebyId = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Organization Service Id is required");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization Id is required");
    }
    const service = await db_1.db.select().from(schema_1.organizationServices).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationServices.id, id), (0, drizzle_orm_1.eq)(schema_1.organizationServices.organizationId, organizationId)));
    return (0, response_1.SuccessResponse)(res, { message: "Organization Service Fetched Successfully", data: service }, 200);
};
exports.getOrganizationServicebyId = getOrganizationServicebyId;
const deleteOrganizationService = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Organization Service Id is required");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization Id is required");
    }
    const orgservice = await db_1.db.select().from(schema_1.organizationServices).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationServices.id, id), (0, drizzle_orm_1.eq)(schema_1.organizationServices.organizationId, organizationId)));
    if (!orgservice) {
        throw new BadRequest_1.BadRequest("Organization Service Not Found");
    }
    await db_1.db.delete(schema_1.organizationServices).where((0, drizzle_orm_1.eq)(schema_1.organizationServices.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Organization Service Deleted Successfully" }, 200);
};
exports.deleteOrganizationService = deleteOrganizationService;
const createOrganizationService = async (req, res) => {
    const { serviceName, serviceDescription, useZonePricing, servicePrice } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization Id is required");
    }
    if (!serviceName) {
        throw new BadRequest_1.BadRequest("Service Name is required");
    }
    if (!serviceDescription) {
        throw new BadRequest_1.BadRequest("Service Description is required");
    }
    // Validate useZonePricing is provided and is a boolean
    if (typeof useZonePricing !== 'boolean') {
        throw new BadRequest_1.BadRequest("useZonePricing must be true or false");
    }
    // If not using zone pricing, servicePrice is required
    if (!useZonePricing && !servicePrice) {
        throw new BadRequest_1.BadRequest("Service Price is required when not using zone pricing");
    }
    await db_1.db.insert(schema_1.organizationServices).values({
        organizationId,
        serviceName,
        serviceDescription,
        useZonePricing,
        servicePrice: useZonePricing ? 0 : servicePrice,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Organization Service Created Successfully" }, 201);
};
exports.createOrganizationService = createOrganizationService;
const updateOrganizationService = async (req, res) => {
    const { id } = req.params;
    const { serviceName, serviceDescription, useZonePricing, servicePrice } = req.body;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Organization Service Id is required");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization Id is required");
    }
    // If not using zone pricing, servicePrice is required
    if (!useZonePricing && !servicePrice) {
        throw new BadRequest_1.BadRequest("Service Price is required when not using zone pricing");
    }
    const orgService = await db_1.db.query.organizationServices.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationServices.id, id), (0, drizzle_orm_1.eq)(schema_1.organizationServices.organizationId, organizationId)),
    });
    if (!orgService) {
        throw new BadRequest_1.BadRequest("Organization Service Not Found");
    }
    await db_1.db.update(schema_1.organizationServices).set({
        serviceName: serviceName || orgService.serviceName,
        serviceDescription: serviceDescription || orgService.serviceDescription,
        useZonePricing: useZonePricing || orgService.useZonePricing,
        servicePrice: useZonePricing ? 0 : servicePrice || orgService.servicePrice,
    }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationServices.id, id), (0, drizzle_orm_1.eq)(schema_1.organizationServices.organizationId, organizationId)));
    return (0, response_1.SuccessResponse)(res, { message: "Organization Service Updated Successfully" }, 200);
};
exports.updateOrganizationService = updateOrganizationService;
