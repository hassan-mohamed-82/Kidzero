"use strict";
// src/controllers/admin/pickupPointController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartmentById = exports.getAllDepartments = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
// ✅ Get All Departments
const getAllDepartments = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allDepartments = await db_1.db
        .select()
        .from(schema_1.departments)
        .where((0, drizzle_orm_1.eq)(schema_1.departments.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { departments: allDepartments }, 200);
};
exports.getAllDepartments = getAllDepartments;
// ✅ Get Department By ID
const getDepartmentById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const department = await db_1.db
        .select()
        .from(schema_1.departments)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.departments.id, id), (0, drizzle_orm_1.eq)(schema_1.departments.organizationId, organizationId)))
        .limit(1);
    if (!department[0]) {
        throw new NotFound_1.NotFound("Department not found");
    }
    (0, response_1.SuccessResponse)(res, { department: department[0] }, 200);
};
exports.getDepartmentById = getDepartmentById;
// ✅ Create Department
const createDepartment = async (req, res) => {
    const { name } = req.body;
    const organizationId = req.user?.organizationId;
    // ✅ تحقق إن الـ organizationId موجود
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!name) {
        throw new BadRequest_1.BadRequest("name is required");
    }
    await db_1.db.insert(schema_1.departments).values({
        organizationId,
        name,
    });
    (0, response_1.SuccessResponse)(res, { message: "Department created successfully" }, 201);
};
exports.createDepartment = createDepartment;
// ✅ Update Department
const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const organizationId = req.user?.organizationId;
    // ✅ تحقق إن الـ organizationId موجود
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingDepartment = await db_1.db
        .select()
        .from(schema_1.departments)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.departments.id, id), (0, drizzle_orm_1.eq)(schema_1.departments.organizationId, organizationId)))
        .limit(1);
    if (!existingDepartment[0]) {
        throw new NotFound_1.NotFound("Department not found");
    }
    await db_1.db
        .update(schema_1.departments)
        .set({ name })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.departments.id, id), (0, drizzle_orm_1.eq)(schema_1.departments.organizationId, organizationId)));
    (0, response_1.SuccessResponse)(res, { message: "Department updated successfully" }, 200);
};
exports.updateDepartment = updateDepartment;
// ✅ Delete Department
const deleteDepartment = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingDepartment = await db_1.db
        .select()
        .from(schema_1.departments)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.departments.id, id), (0, drizzle_orm_1.eq)(schema_1.departments.organizationId, organizationId)))
        .limit(1);
    if (!existingDepartment[0]) {
        throw new NotFound_1.NotFound("Department not found");
    }
    await db_1.db.delete(schema_1.departments).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.departments.id, id), (0, drizzle_orm_1.eq)(schema_1.departments.organizationId, organizationId)));
    (0, response_1.SuccessResponse)(res, { message: "Department deleted successfully" }, 200);
};
exports.deleteDepartment = deleteDepartment;
