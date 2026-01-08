"use strict";
// src/controllers/admin/studentController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = exports.updateStudent = exports.getStudentById = exports.getAllStudents = exports.createStudent = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const uuid_1 = require("uuid");
// ✅ Create Student
const createStudent = async (req, res) => {
    const { parentId, name, avatar, grade, classroom } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // await checkStudentLimit(organizationId);
    const parent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parents.id, parentId), (0, drizzle_orm_1.eq)(schema_1.parents.organizationId, organizationId)))
        .limit(1);
    if (!parent[0]) {
        throw new NotFound_1.NotFound("Parent not found");
    }
    const studentId = (0, uuid_1.v4)();
    let avatarUrl = null;
    if (avatar) {
        const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `students/${studentId}`);
        avatarUrl = result.url;
    }
    await db_1.db.insert(schema_1.students).values({
        id: studentId,
        organizationId,
        parentId,
        name,
        avatar: avatarUrl,
        grade: grade || null,
        classroom: classroom || null,
    });
    (0, response_1.SuccessResponse)(res, { message: "Student created successfully", studentId }, 201);
};
exports.createStudent = createStudent;
// ✅ Get All Students
const getAllStudents = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allStudents = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        status: schema_1.students.status,
        createdAt: schema_1.students.createdAt,
        updatedAt: schema_1.students.updatedAt,
        parent: {
            id: schema_1.parents.id,
            name: schema_1.parents.name,
            phone: schema_1.parents.phone,
        },
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { students: allStudents }, 200);
};
exports.getAllStudents = getAllStudents;
// ✅ Get Student By ID
const getStudentById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const student = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        status: schema_1.students.status,
        createdAt: schema_1.students.createdAt,
        updatedAt: schema_1.students.updatedAt,
        parent: {
            id: schema_1.parents.id,
            name: schema_1.parents.name,
            phone: schema_1.parents.phone,
            address: schema_1.parents.address,
        },
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, id), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)))
        .limit(1);
    if (!student[0]) {
        throw new NotFound_1.NotFound("Student not found");
    }
    (0, response_1.SuccessResponse)(res, { student: student[0] }, 200);
};
exports.getStudentById = getStudentById;
// ✅ Update Student
const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { parentId, name, avatar, grade, classroom, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingStudent = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, id), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)))
        .limit(1);
    if (!existingStudent[0]) {
        throw new NotFound_1.NotFound("Student not found");
    }
    if (parentId && parentId !== existingStudent[0].parentId) {
        const parent = await db_1.db
            .select()
            .from(schema_1.parents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parents.id, parentId), (0, drizzle_orm_1.eq)(schema_1.parents.organizationId, organizationId)))
            .limit(1);
        if (!parent[0]) {
            throw new NotFound_1.NotFound("Parent not found");
        }
    }
    let avatarUrl = existingStudent[0].avatar;
    if (avatar !== undefined) {
        if (existingStudent[0].avatar) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingStudent[0].avatar);
        }
        if (avatar) {
            const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `students/${id}`);
            avatarUrl = result.url;
        }
        else {
            avatarUrl = null;
        }
    }
    await db_1.db.update(schema_1.students).set({
        parentId: parentId ?? existingStudent[0].parentId,
        name: name ?? existingStudent[0].name,
        avatar: avatarUrl,
        grade: grade !== undefined ? grade : existingStudent[0].grade,
        classroom: classroom !== undefined ? classroom : existingStudent[0].classroom,
        status: status ?? existingStudent[0].status,
    }).where((0, drizzle_orm_1.eq)(schema_1.students.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Student updated successfully" }, 200);
};
exports.updateStudent = updateStudent;
// ✅ Delete Student
const deleteStudent = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingStudent = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, id), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)))
        .limit(1);
    if (!existingStudent[0]) {
        throw new NotFound_1.NotFound("Student not found");
    }
    if (existingStudent[0].avatar) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingStudent[0].avatar);
    }
    await db_1.db.delete(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Student deleted successfully" }, 200);
};
exports.deleteStudent = deleteStudent;
