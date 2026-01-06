import { Request, Response } from "express";
import { db } from "../../models/db";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";
import { organizations, organizationTypes } from "../../models/schema";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
// Organization Types
export const getAllOrganizationTypes = async (req: Request, res: Response) => {
    const orgTypes = await db.query.organizationTypes.findMany();
    return SuccessResponse(res, { orgTypes }, 200);
};

export const getOrganizationTypeById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const orgType = await db.query.organizationTypes.findFirst({
        where: eq(organizationTypes.id, id),
    });
    if (!orgType) {
        throw new BadRequest("Organization type not found");
    }
    return SuccessResponse(res, { orgType }, 200);
};

export const createOrganizationType = async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
        throw new BadRequest("Organization type name is required");
    }
    const newOrgType = await db.insert(organizationTypes).values({
        name
    });
    return SuccessResponse(res, { message: "Organization type created successfully" }, 201);
};

export const updateOrganizationType = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!id) {
        throw new BadRequest("Organization type ID is required");
    }
    const orgType = await db.query.organizationTypes.findFirst({
        where: eq(organizationTypes.id, id),
    });
    if (!orgType) {
        throw new BadRequest("Organization type not found");
    }
    await db.update(organizationTypes).set({
        name: name || orgType.name,
    }).where(eq(organizationTypes.id, id));
    return SuccessResponse(res, { message: "Organization type updated successfully" }, 200);
};

export const deleteOrganizationType = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Organization type ID is required");
    }
    const orgType = await db.query.organizationTypes.findFirst({
        where: eq(organizationTypes.id, id),
    });
    if (!orgType) {
        throw new BadRequest("Organization type not found");
    }
    await db.delete(organizationTypes).where(eq(organizationTypes.id, id));
    return SuccessResponse(res, { message: "Organization type deleted successfully" }, 200);
};


// Organizations
export const getAllOrganizations = async (req: Request, res: Response) => {
    const orgs = await db.query.organizations.findMany();
    return SuccessResponse(res, { orgs }, 200);
};

export const getOrganizationById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Organization ID is required");
    }
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    });
    if (!org) {
        throw new BadRequest("Organization not found");
    }
    return SuccessResponse(res, { org }, 200);
};

export const createOrganization = async (req: Request, res: Response) => {
    const { name, phone, email, address, organizationTypeId, logo } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !address || !organizationTypeId || !logo) {
        throw new BadRequest("Missing required fields");
    }

    // Validate base64 format
    if (!logo.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/)) {
        throw new BadRequest("Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)");
    }

    // Verify organization type exists
    const orgType = await db.query.organizationTypes.findFirst({
        where: eq(organizationTypes.id, organizationTypeId),
    });
    if (!orgType) {
        throw new BadRequest("Organization type not found");
    }

    // Generate a unique ID for the organization
    const orgId = crypto.randomUUID();

    // Save the logo and get the URL
    let logoUrl: string;
    try {
        logoUrl = await saveBase64Image(
            logo,
            orgId,
            req,
            'organizations' // folder name
        );
    } catch (error: any) {
        throw new BadRequest(`Failed to save logo: ${error.message}`);
    }

    // Create organization with the logo URL
    await db.insert(organizations).values({
        id: orgId,
        name,
        phone,
        email,
        address,
        organizationTypeId,
        subscriptionId: null,
        logo: logoUrl,
    });

    return SuccessResponse(res, {
        message: "Organization created successfully"
    }, 201);
};

export const updateOrganization = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new BadRequest("Organization ID is required");
    }

    const { name, phone, email, address, organizationTypeId, logo } = req.body;

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    });

    if (!org) {
        throw new BadRequest("Organization not found");
    }
    // If organizationType is being updated, verify it exists
    if (organizationTypeId) {
        const orgType = await db.query.organizationTypes.findFirst({
            where: eq(organizationTypes.id, organizationTypeId),
        });
        if (!orgType) {
            throw new BadRequest("Organization type not found");
        }
    }
    let logoUrl = org.logo;
    if (logo) {
        // Validate base64 format
        if (!logo.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/)) {
            throw new BadRequest("Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)");
        }
        // Save the new logo and get the URL
        try {
            logoUrl = await saveBase64Image(
                logo,
                id,
                req,
                'organizations' // folder name
            );
        } catch (error: any) {
            throw new BadRequest(`Failed to save logo: ${error.message}`);
        }
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
    if (!id) {
        throw new BadRequest("Organization ID is required");
    }
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    });
    if (!org) {
        throw new BadRequest("Organization not found");
    }
    deletePhotoFromServer(org.logo);

    await db.delete(organizations).where(eq(organizations.id, id));
    return SuccessResponse(res, { message: "Organization deleted successfully" }, 200);
};
