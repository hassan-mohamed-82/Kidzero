import { db } from "../../models/db";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";
import { organizationTypes } from "../../models/schema";
// Organization Types
export const getAllOrganizationTypes = async (req, res) => {
    const orgTypes = await db.query.organizationTypes.findMany();
    return SuccessResponse(res, { orgTypes }, 200);
};
export const getOrganizationTypeById = async (req, res) => {
    const { id } = req.params;
    const orgType = await db.query.organizationTypes.findFirst({
        where: eq(organizationTypes.id, id),
    });
    if (!orgType) {
        throw new BadRequest("Organization type not found");
    }
    return SuccessResponse(res, { orgType }, 200);
};
export const createOrganizationType = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new BadRequest("Organization type name is required");
    }
    const newOrgType = await db.insert(organizationTypes).values({
        name
    });
    return SuccessResponse(res, { message: "Organization type created successfully" }, 201);
};
export const updateOrganizationType = async (req, res) => {
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
export const deleteOrganizationType = async (req, res) => {
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
//# sourceMappingURL=organization.js.map