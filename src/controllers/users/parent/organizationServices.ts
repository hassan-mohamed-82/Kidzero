import { Request, Response } from "express";
import { db } from "../../../models/db";
import { SuccessResponse } from "../../../utils/response";
import { organizationServices , students} from "../../../models/schema";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../../Errors/BadRequest";

export const getAllAvailableOrganizationServices = async (req: Request, res: Response) => {
    const studentId = req.params.studentId;
    if (!studentId) {
        throw new BadRequest("Student ID is required");
    }
    const student = await db.query.students.findFirst({ where: eq(students.id, studentId), });
    if (!student) {
        throw new BadRequest("Student Not Found");
    }
    const orgServices = await db.query.organizationServices.findMany({ where: eq(organizationServices.organizationId, student.organizationId), });
    return SuccessResponse(res, { message: "Available Organization Services retrieved successfully", orgServices }, 200);
}