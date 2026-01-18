import { Request, Response } from "express";
import { db } from "../../models/db";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq, inArray } from "drizzle-orm";
import { admins, organizations, organizationTypes, buses, rides, students } from "../../models/schema";
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
    const existingType = await db.query.organizationTypes.findFirst({
        where: eq(organizationTypes.name, name),
    });
    if (existingType) {
        throw new BadRequest("Organization type with this name already exists");
    }
    await db.insert(organizationTypes).values({ name });
    return SuccessResponse(res, { message: "Organization type created successfully" }, 201);
};

export const updateOrganizationType = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    requireId(id, "Organization type");
    const orgType = await findOrganizationType(id);
    if (name) {
        const existingType = await db.query.organizationTypes.findFirst({
            where: eq(organizationTypes.name, name),
        });
        if (existingType && existingType.id !== id) {
            throw new BadRequest("Organization type with this name already exists");
        } else if (existingType && existingType.id === id) {
            return SuccessResponse(res, { message: "No changes detected" }, 200);
        }
    }

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

        const orgs = await db
            .select({
                id: organizations.id,
                name: organizations.name,
                email: organizations.email,
                phone: organizations.phone,
                status: organizations.status,
                organizationTypeId: organizations.organizationTypeId,
                organizationTypeName: organizationTypes.name,
            })
            .from(organizations)
            .leftJoin(organizationTypes, eq(organizations.organizationTypeId, organizationTypes.id));

        if (orgs.length === 0) {
            return SuccessResponse(res, { orgs: [] }, 200);
        }

        const orgIds = orgs.map(o => o.id);

        // Fetch all related data in parallel
        const [allBuses, allRides, allStudents] = await Promise.all([
            db.query.buses.findMany({
                where: inArray(buses.organizationId, orgIds),
            }),
            db.query.rides.findMany({
                where: inArray(rides.organizationId, orgIds),
            }),
            db.query.students.findMany({
                where: inArray(students.organizationId, orgIds),
                columns: { id: true, name: true, organizationId: true },
            }),
        ]);

        // Group related data by organization ID
        const busesMap = new Map<string, typeof allBuses>();
        const ridesMap = new Map<string, typeof allRides>();
        const studentsMap = new Map<string, typeof allStudents>();

        allBuses.forEach(bus => {
            if (!busesMap.has(bus.organizationId)) {
                busesMap.set(bus.organizationId, []);
            }
            busesMap.get(bus.organizationId)!.push(bus);
        });

        allRides.forEach(ride => {
            if (!ridesMap.has(ride.organizationId)) {
                ridesMap.set(ride.organizationId, []);
            }
            ridesMap.get(ride.organizationId)!.push(ride);
        });

        allStudents.forEach(student => {
            if (!studentsMap.has(student.organizationId)) {
                studentsMap.set(student.organizationId, []);
            }
            studentsMap.get(student.organizationId)!.push(student);
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
    const { 
        name, 
        phone, 
        email, 
        address, 
        organizationTypeId, 
        logo,
        adminPassword  // ✅ إضافة الباسورد من الـ Request
    } = req.body;

    // ✅ إضافة adminPassword في الـ Validation
    if (!name || !phone || !email || !address || !organizationTypeId || !logo || !adminPassword) {
        throw new BadRequest("Missing required fields");
    }

    // ✅ Validate password strength (اختياري)
    if (adminPassword.length < 8) {
        throw new BadRequest("Password must be at least 8 characters");
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
    });

    // ✅ استخدام الباسورد من الـ Request
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
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
        message: "Organization created successfully",
        organization: {
            id: orgId,
            name,
            email,
        },
        adminCredentials: {
            email: email,
            password: adminPassword  // ✅ إرجاع الباسورد اللي دخله
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
