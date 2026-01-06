// src/controllers/admin/pickupPointController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { departments } from "../../models/schema";
import { eq,and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
 
// ✅ Get All Departments
export const getAllDepartments = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const allDepartments = await db
        .select()
        .from(departments)
        .where(eq(departments.organizationId, organizationId));
    SuccessResponse(res, { departments: allDepartments }, 200);
}
// ✅ Get Department By ID
export const getDepartmentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const department = await db
        .select()
        .from(departments)
        .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)))
        .limit(1);
    if (!department[0]) {
        throw new NotFound("Department not found");
    }
    SuccessResponse(res, { department: department[0] }, 200);
}
// ✅ Create Department
export const createDepartment = async (req: Request, res: Response) => {
    const { name } = req.body;
    const organizationId = req.user?.organizationId;
    // ✅ تحقق إن الـ organizationId موجود
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    if (!name) {
        throw new BadRequest("name is required");
    }
    await db.insert(departments).values({
        organizationId,  
        name,
    });
    SuccessResponse(res, { message: "Department created successfully" }, 201);
}
// ✅ Update Department
export const updateDepartment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const organizationId = req.user?.organizationId;
    // ✅ تحقق إن الـ organizationId موجود
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }             
    const existingDepartment = await db
        .select()
        .from(departments)
        .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)))
        .limit(1);
    if (!existingDepartment[0]) {
        throw new NotFound("Department not found");
    }
    await db
        .update(departments)
        .set({ name })
        .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)));
    SuccessResponse(res, { message: "Department updated successfully" }, 200);
}
// ✅ Delete Department
export const deleteDepartment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const existingDepartment = await db
        .select()
        .from(departments)
        .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)))
        .limit(1);
    if (!existingDepartment[0]) {
        throw new NotFound("Department not found");
    }
    await db.delete(departments).where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)));
    SuccessResponse(res, { message: "Department deleted successfully" }, 200);
}