import { Request, Response } from "express";
import { db } from "../../../models/db";
import { SuccessResponse } from "../../../utils/response";
import { organizationServices, students, zones } from "../../../models/schema";
import { eq, sql } from "drizzle-orm";
import { BadRequest } from "../../../Errors/BadRequest";

export const getAllAvailableOrganizationServices = async (req: Request, res: Response) => {
    const studentId = req.params.studentId;

    if (!studentId) {
        throw new BadRequest("Student ID is required");
    }

    // We perform a join starting from the Services table.
    // 1. Join Students to ensure we only get services for their Organization.
    // 2. Join Zones to get the cost associated with that Student's zone.
    const orgServices = await db
        .select({
            id: organizationServices.id,
            serviceName: organizationServices.serviceName,
            serviceDescription: organizationServices.serviceDescription,
            baseServicePrice: organizationServices.servicePrice, // The default price
            useZonePricing: organizationServices.useZonePricing,

            // The cost of the zone the student belongs to
            studentZoneCost: zones.cost,

            // CALCULATED FIELD: The final price the user sees
            finalPrice: sql<number>`
                CASE 
                    WHEN ${organizationServices.useZonePricing} = true THEN ${zones.cost}
                    ELSE ${organizationServices.servicePrice}
                END`
        })
        .from(organizationServices)
        // Join Student to filter services by the Student's Organization
        .innerJoin(students, eq(organizationServices.organizationId, students.organizationId))
        // Join Zones to get the cost for the Student's specific Zone
        .innerJoin(zones, eq(students.zoneId, zones.id))
        // Filter by the specific Student ID provided in params
        .where(eq(students.id, studentId));

    return SuccessResponse(res, {
        message: "Available Organization Services retrieved successfully",
        orgServices
    }, 200);
}