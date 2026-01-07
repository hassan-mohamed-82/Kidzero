"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrganization = exports.updateOrganization = exports.createOrganization = exports.getOrganizationById = exports.getAllOrganizations = exports.deleteOrganizationType = exports.updateOrganizationType = exports.createOrganizationType = exports.getOrganizationTypeById = exports.getAllOrganizationTypes = void 0;
const db_1 = require("../../models/db");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../models/schema");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
// ==================== Helper Functions ====================
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
const findOrganizationType = async (id) => {
    const orgType = await db_1.db.query.organizationTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id),
    });
    if (!orgType)
        throw new BadRequest_1.BadRequest("Organization type not found");
    return orgType;
};
const findOrganization = async (id) => {
    const org = await db_1.db.query.organizations.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizations.id, id),
    });
    if (!org)
        throw new BadRequest_1.BadRequest("Organization not found");
    return org;
};
const validateAndSaveLogo = async (req, logo) => {
    if (!logo.match(BASE64_IMAGE_REGEX)) {
        throw new BadRequest_1.BadRequest("Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)");
    }
    try {
        const logoData = await (0, handleImages_1.saveBase64Image)(req, logo, 'organizations');
        return logoData.url;
    }
    catch (error) {
        throw new BadRequest_1.BadRequest(`Failed to save logo: ${error.message}`);
    }
};
const requireId = (id, entity) => {
    if (!id)
        throw new BadRequest_1.BadRequest(`${entity} ID is required`);
};
// ==================== Organization Types ====================
const getAllOrganizationTypes = async (req, res) => {
    const orgTypes = await db_1.db.query.organizationTypes.findMany();
    return (0, response_1.SuccessResponse)(res, { orgTypes }, 200);
};
exports.getAllOrganizationTypes = getAllOrganizationTypes;
const getOrganizationTypeById = async (req, res) => {
    const orgType = await findOrganizationType(req.params.id);
    return (0, response_1.SuccessResponse)(res, { orgType }, 200);
};
exports.getOrganizationTypeById = getOrganizationTypeById;
const createOrganizationType = async (req, res) => {
    const { name } = req.body;
    if (!name)
        throw new BadRequest_1.BadRequest("Organization type name is required");
    await db_1.db.insert(schema_1.organizationTypes).values({ name });
    return (0, response_1.SuccessResponse)(res, { message: "Organization type created successfully" }, 201);
};
exports.createOrganizationType = createOrganizationType;
const updateOrganizationType = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    requireId(id, "Organization type");
    const orgType = await findOrganizationType(id);
    await db_1.db.update(schema_1.organizationTypes)
        .set({ name: name || orgType.name })
        .where((0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Organization type updated successfully" }, 200);
};
exports.updateOrganizationType = updateOrganizationType;
const deleteOrganizationType = async (req, res) => {
    const { id } = req.params;
    requireId(id, "Organization type");
    await findOrganizationType(id);
    await db_1.db.delete(schema_1.organizationTypes).where((0, drizzle_orm_1.eq)(schema_1.organizationTypes.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Organization type deleted successfully" }, 200);
};
exports.deleteOrganizationType = deleteOrganizationType;
// ==================== Organizations ====================
const getAllOrganizations = async (req, res) => {
    const orgs = await db_1.db.query.organizations.findMany();
    return (0, response_1.SuccessResponse)(res, { orgs }, 200);
};
exports.getAllOrganizations = getAllOrganizations;
const getOrganizationById = async (req, res) => {
    const { id } = req.params;
    requireId(id, "Organization");
    const org = await findOrganization(id);
    return (0, response_1.SuccessResponse)(res, { org }, 200);
};
exports.getOrganizationById = getOrganizationById;
const createOrganization = async (req, res) => {
    const { name, phone, email, address, organizationTypeId, logo } = req.body;
    if (!name || !phone || !email || !address || !organizationTypeId || !logo) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    await findOrganizationType(organizationTypeId);
    const logoUrl = await validateAndSaveLogo(req, logo);
    await db_1.db.insert(schema_1.organizations).values({
        name,
        phone,
        email,
        address,
        organizationTypeId,
        logo: logoUrl,
        // شيلت subscriptionId: null
    });
    return (0, response_1.SuccessResponse)(res, { message: "Organization created successfully" }, 201);
};
exports.createOrganization = createOrganization;
const updateOrganization = async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, address, organizationTypeId, logo } = req.body;
    requireId(id, "Organization");
    const org = await findOrganization(id);
    if (organizationTypeId) {
        await findOrganizationType(organizationTypeId);
    }
    let logoUrl = org.logo;
    if (logo) {
        if (org.logo)
            await (0, deleteImage_1.deletePhotoFromServer)(org.logo);
        logoUrl = await validateAndSaveLogo(req, logo);
    }
    await db_1.db.update(schema_1.organizations).set({
        name: name || org.name,
        phone: phone || org.phone,
        email: email || org.email,
        address: address || org.address,
        organizationTypeId: organizationTypeId || org.organizationTypeId,
        logo: logoUrl,
    }).where((0, drizzle_orm_1.eq)(schema_1.organizations.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Organization updated successfully" }, 200);
};
exports.updateOrganization = updateOrganization;
const deleteOrganization = async (req, res) => {
    const { id } = req.params;
    requireId(id, "Organization");
    const org = await findOrganization(id);
    if (org.logo)
        await (0, deleteImage_1.deletePhotoFromServer)(org.logo);
    await db_1.db.delete(schema_1.organizations).where((0, drizzle_orm_1.eq)(schema_1.organizations.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Organization deleted successfully" }, 200);
};
exports.deleteOrganization = deleteOrganization;
