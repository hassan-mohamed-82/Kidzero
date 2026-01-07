"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrganization = exports.updateOrganization = exports.createOrganization = exports.getOrganizationById = exports.getAllOrganizations = exports.deleteOrganizationType = exports.updateOrganizationType = exports.createOrganizationType = exports.getOrganizationTypeById = exports.getAllOrganizationTypes = void 0;
const db_1 = require("../../models/db");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../models/schema");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const bcrypt_1 = __importDefault(require("bcrypt"));
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
// export const getAllOrganizations = async (req: Request, res: Response) => {
//     const orgs = await db.query.organizations.findMany();
//     return SuccessResponse(res, { orgs }, 200);
// };
const getAllOrganizations = async (req, res) => {
    try {
        const orgs = await db_1.db.query.organizations.findMany({
            // Select specific columns from the main table
            columns: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true, // Item 8: Status (active, blocked, subscribed)
            },
            // "Populate" related tables
            with: {
                // Item 2: Organization Type
                organizationType: {
                    columns: {
                        name: true, // Only get the name of the type
                    }
                },
                // Item 5: Buses
                buses: true, // specific columns not needed? 'true' returns all
                // Item 7: Rides
                rides: true,
                // Item 6: Students (Uncomment when you add the relation)
                /* students: {
                    columns: { id: true, name: true }
                }
                */
            },
        });
        const formattedOrgs = orgs.map(org => ({
            ...org,
            organizationType: org.organizationType,
        }));
        return (0, response_1.SuccessResponse)(res, { orgs: formattedOrgs }, 200);
    }
    catch (error) {
        throw new BadRequest_1.BadRequest(`Failed to retrieve organizations: ${error}`);
    }
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
    const existingOrg = await db_1.db.query.organizations.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizations.email, email),
    });
    if (existingOrg) {
        throw new BadRequest_1.BadRequest("Organization with this email already exists");
    }
    const orgId = crypto.randomUUID();
    await db_1.db.insert(schema_1.organizations).values({
        id: orgId,
        name,
        phone,
        email,
        address,
        organizationTypeId,
        logo: logoUrl,
        // شيلت subscriptionId: null
    });
    // Create the Main Admin for the organization - هنا بكريت الادمن الرئيسي للمنظمة
    // const passwordAdmin = crypto.randomBytes(8).toString('hex'); // Generate a random password
    const passwordAdmin = "Admin@1234";
    const hashedPassword = await bcrypt_1.default.hash(passwordAdmin, 10);
    const AdminName = name + " Admin";
    await db_1.db.insert(schema_1.admins).values({
        organizationId: orgId,
        name: AdminName,
        email: email,
        password: hashedPassword,
        phone: phone || null,
        avatar: logoUrl || null,
        roleId: null,
        type: "organizer",
    });
    return (0, response_1.SuccessResponse)(res, { message: "Organization created successfully", adminCredentials: {
            email: email,
            password: passwordAdmin
        } }, 201);
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
