import { Request, Response } from "express";
import { db } from "../../models/db";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";
import { admins, organizations, organizationTypes } from "../../models/schema";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import bcrypt from "bcrypt";


// ==================== Helper Functions ====================

const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

const findOrganizationType = async (id: string) => {
    const orgType = await db.query.organizationTypes.findFirst({
        where: eq(organizationTypes.id, id),
    });
    if (!orgType) throw new BadRequest("Organization type not found");
    return orgType;
};

const findOrganization = async (id: string) => {
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    });
    if (!org) throw new BadRequest("Organization not found");
    return org;
};

const validateAndSaveLogo = async (req: Request, logo: string): Promise<string> => {
    if (!logo.match(BASE64_IMAGE_REGEX)) {
        throw new BadRequest("Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)");
    }
    try {
        const logoData = await saveBase64Image(req, logo, 'organizations');
        return logoData.url;
    } catch (error: any) {
        throw new BadRequest(`Failed to save logo: ${error.message}`);
    }
};

const requireId = (id: string | undefined, entity: string) => {
    if (!id) throw new BadRequest(`${entity} ID is required`);
};

// ==================== Organization Types ====================

export const getAllOrganizationTypes = async (req: Request, res: Response) => {
    const orgTypes = await db.query.organizationTypes.findMany();
    return SuccessResponse(res, { orgTypes }, 200);
};

export const getOrganizationTypeById = async (req: Request, res: Response) => {
    const orgType = await findOrganizationType(req.params.id);
    return SuccessResponse(res, { orgType }, 200);
};

export const createOrganizationType = async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) throw new BadRequest("Organization type name is required");

    await db.insert(organizationTypes).values({ name });
    return SuccessResponse(res, { message: "Organization type created successfully" }, 201);
};

export const updateOrganizationType = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    requireId(id, "Organization type");
    const orgType = await findOrganizationType(id);

    await db.update(organizationTypes)
        .set({ name: name || orgType.name })
        .where(eq(organizationTypes.id, id));

    return SuccessResponse(res, { message: "Organization type updated successfully" }, 200);
};

export const deleteOrganizationType = async (req: Request, res: Response) => {
    const { id } = req.params;

    requireId(id, "Organization type");
    await findOrganizationType(id);

    await db.delete(organizationTypes).where(eq(organizationTypes.id, id));
    return SuccessResponse(res, { message: "Organization type deleted successfully" }, 200);
};

// ==================== Organizations ====================

// export const getAllOrganizations = async (req: Request, res: Response) => {
//     const orgs = await db.query.organizations.findMany();
//     return SuccessResponse(res, { orgs }, 200);
// };

export const getAllOrganizations = async (req: Request, res: Response) => {
    try {
        const orgs = await db.query.organizations.findMany({
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

                // Item 6: Students
                students: {
                    columns: { id: true, name: true }
                }
            },
        });

        const formattedOrgs = orgs.map(org => ({
            ...org,
            organizationType: org.organizationType,
        }));

        return SuccessResponse(res, { orgs: formattedOrgs }, 200);

    } catch (error) {
        throw new BadRequest(`Failed to retrieve organizations: ${error}`);
    }
};

export const getOrganizationById = async (req: Request, res: Response) => {
    const { id } = req.params;
    requireId(id, "Organization");

    const org = await findOrganization(id);
    return SuccessResponse(res, { org }, 200);
};

export const createOrganization = async (req: Request, res: Response) => {
    const { name, phone, email, address, organizationTypeId, logo } = req.body;

    if (!name || !phone || !email || !address || !organizationTypeId || !logo) {
        throw new BadRequest("Missing required fields");
    }

    await findOrganizationType(organizationTypeId);
    const logoUrl = await validateAndSaveLogo(req, logo);
    const existingOrg = await db.query.organizations.findFirst({
        where: eq(organizations.email, email),
    });

    if (existingOrg) {
        throw new BadRequest("Organization with this email already exists");
    }

    const orgId = crypto.randomUUID();


    await db.insert(organizations).values({
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
    const hashedPassword = await bcrypt.hash(passwordAdmin, 10);
    const AdminName = name + " Admin";

    await db.insert(admins).values({
        organizationId: orgId,
        name: AdminName,
        email: email,
        password: hashedPassword,
        phone: phone || null,
        avatar: logoUrl || null,
        roleId: null,
        type: "organizer",
    });

    return SuccessResponse(res, {
        message: "Organization created successfully", adminCredentials: {
            email: email,
            password: passwordAdmin
        }
    }, 201);
};


export const updateOrganization = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, email, address, organizationTypeId, logo } = req.body;

    requireId(id, "Organization");
    const org = await findOrganization(id);

    if (organizationTypeId) {
        await findOrganizationType(organizationTypeId);
    }

    let logoUrl = org.logo;
    if (logo) {
        if (org.logo) await deletePhotoFromServer(org.logo);
        logoUrl = await validateAndSaveLogo(req, logo);
    }

    await db.update(organizations).set({
        name: name || org.name,
        phone: phone || org.phone,
        email: email || org.email,
        address: address || org.address,
        organizationTypeId: organizationTypeId || org.organizationTypeId,
        logo: logoUrl,
    }).where(eq(organizations.id, id));

    return SuccessResponse(res, { message: "Organization updated successfully" }, 200);
};

export const deleteOrganization = async (req: Request, res: Response) => {
    const { id } = req.params;

    requireId(id, "Organization");
    const org = await findOrganization(id);

    if (org.logo) await deletePhotoFromServer(org.logo);

    await db.delete(organizations).where(eq(organizations.id, id));
    return SuccessResponse(res, { message: "Organization deleted successfully" }, 200);
};
