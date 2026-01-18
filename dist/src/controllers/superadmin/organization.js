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
    const existingType = await db_1.db.query.organizationTypes.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizationTypes.name, name),
    });
    if (existingType) {
        throw new BadRequest_1.BadRequest("Organization type with this name already exists");
    }
    await db_1.db.insert(schema_1.organizationTypes).values({ name });
    return (0, response_1.SuccessResponse)(res, { message: "Organization type created successfully" }, 201);
};
exports.createOrganizationType = createOrganizationType;
const updateOrganizationType = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    requireId(id, "Organization type");
    const orgType = await findOrganizationType(id);
    if (name) {
        const existingType = await db_1.db.query.organizationTypes.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.organizationTypes.name, name),
        });
        if (existingType && existingType.id !== id) {
            throw new BadRequest_1.BadRequest("Organization type with this name already exists");
        }
        else if (existingType && existingType.id === id) {
            return (0, response_1.SuccessResponse)(res, { message: "No changes detected" }, 200);
        }
    }
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
        const orgs = await db_1.db
            .select({
            id: schema_1.organizations.id,
            name: schema_1.organizations.name,
            email: schema_1.organizations.email,
            phone: schema_1.organizations.phone,
            status: schema_1.organizations.status,
            organizationTypeId: schema_1.organizations.organizationTypeId,
            organizationTypeName: schema_1.organizationTypes.name,
        })
            .from(schema_1.organizations)
            .leftJoin(schema_1.organizationTypes, (0, drizzle_orm_1.eq)(schema_1.organizations.organizationTypeId, schema_1.organizationTypes.id));
        if (orgs.length === 0) {
            return (0, response_1.SuccessResponse)(res, { orgs: [] }, 200);
        }
        const orgIds = orgs.map(o => o.id);
        // Fetch all related data in parallel
        const [allBuses, allRides, allStudents] = await Promise.all([
            db_1.db.query.buses.findMany({
                where: (0, drizzle_orm_1.inArray)(schema_1.buses.organizationId, orgIds),
            }),
            db_1.db.query.rides.findMany({
                where: (0, drizzle_orm_1.inArray)(schema_1.rides.organizationId, orgIds),
            }),
            db_1.db.query.students.findMany({
                where: (0, drizzle_orm_1.inArray)(schema_1.students.organizationId, orgIds),
                columns: { id: true, name: true, organizationId: true },
            }),
        ]);
        // Group related data by organization ID
        const busesMap = new Map();
        const ridesMap = new Map();
        const studentsMap = new Map();
        allBuses.forEach(bus => {
            if (!busesMap.has(bus.organizationId)) {
                busesMap.set(bus.organizationId, []);
            }
            busesMap.get(bus.organizationId).push(bus);
        });
        allRides.forEach(ride => {
            if (!ridesMap.has(ride.organizationId)) {
                ridesMap.set(ride.organizationId, []);
            }
            ridesMap.get(ride.organizationId).push(ride);
        });
        allStudents.forEach(student => {
            if (!studentsMap.has(student.organizationId)) {
                studentsMap.set(student.organizationId, []);
            }
            studentsMap.get(student.organizationId).push(student);
        });
        // Format the response
        const formattedOrgs = orgs.map(org => ({
            id: org.id,
            name: org.name,
            email: org.email,
            phone: org.phone,
            status: org.status,
            organizationType: {
                name: org.organizationTypeName,
            },
            buses: busesMap.get(org.id) || [],
            rides: ridesMap.get(org.id) || [],
            students: studentsMap.get(org.id) || [],
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
    const { name, phone, email, address, organizationTypeId, logo, adminPassword // ✅ إضافة الباسورد من الـ Request
     } = req.body;
    // ✅ إضافة adminPassword في الـ Validation
    if (!name || !phone || !email || !address || !organizationTypeId || !logo || !adminPassword) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    // ✅ Validate password strength (اختياري)
    if (adminPassword.length < 8) {
        throw new BadRequest_1.BadRequest("Password must be at least 8 characters");
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
    });
    // ✅ استخدام الباسورد من الـ Request
    const hashedPassword = await bcrypt_1.default.hash(adminPassword, 10);
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
    return (0, response_1.SuccessResponse)(res, {
        message: "Organization created successfully",
        organization: {
            id: orgId,
            name,
            email,
        },
        adminCredentials: {
            email: email,
            password: adminPassword // ✅ إرجاع الباسورد اللي دخله
        }
    }, 201);
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
