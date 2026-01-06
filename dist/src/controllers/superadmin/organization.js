"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrganizationType = exports.updateOrganizationType = exports.createOrganizationType = exports.getOrganizationTypeById = exports.getAllOrganizationTypes = void 0;
const db_1 = require("../../models/db");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../models/schema");
// Organization Types
const getAllOrganizationTypes = async (req, res) => {
    const orgTypes = await db_1.db.query.organizationTypes.findMany();
    return (0, response_1.SuccessResponse)(res, { orgTypes }, 200);
};
exports.getAllOrganizationTypes = getAllOrganizationTypes;
const getOrganizationTypeById = async (req, res) => {
    const { id } = req.params;
    const orgType = await db_1.db.query.organizationTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id),
    });
    if (!orgType) {
        throw new BadRequest_1.BadRequest("Organization type not found");
    }
    return (0, response_1.SuccessResponse)(res, { orgType }, 200);
};
exports.getOrganizationTypeById = getOrganizationTypeById;
const createOrganizationType = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new BadRequest_1.BadRequest("Organization type name is required");
    }
    const newOrgType = await db_1.db.insert(schema_1.organizationTypes).values({
        name
    });
    return (0, response_1.SuccessResponse)(res, { message: "Organization type created successfully" }, 201);
};
exports.createOrganizationType = createOrganizationType;
const updateOrganizationType = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!id) {
        throw new BadRequest_1.BadRequest("Organization type ID is required");
    }
    const orgType = await db_1.db.query.organizationTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id),
    });
    if (!orgType) {
        throw new BadRequest_1.BadRequest("Organization type not found");
    }
    await db_1.db.update(schema_1.organizationTypes).set({
        name: name || orgType.name,
    }).where((0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Organization type updated successfully" }, 200);
};
exports.updateOrganizationType = updateOrganizationType;
const deleteOrganizationType = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Organization type ID is required");
    }
    const orgType = await db_1.db.query.organizationTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id),
    });
    if (!orgType) {
        throw new BadRequest_1.BadRequest("Organization type not found");
    }
    await db_1.db.delete(schema_1.organizationTypes).where((0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Organization type deleted successfully" }, 200);
};
exports.deleteOrganizationType = deleteOrganizationType;
