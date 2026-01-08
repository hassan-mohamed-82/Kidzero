"use strict";
// src/controllers/admin/parentController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteParent = exports.updateParent = exports.getParentById = exports.getAllParents = exports.createParent = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
// ✅ Create Parent
const createParent = async (req, res) => {
    const { name, phone, password, avatar, address, nationalId } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingParent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.phone, phone))
        .limit(1);
    if (existingParent[0]) {
        throw new BadRequest_1.BadRequest("Phone number already registered");
    }
    const parentId = (0, uuid_1.v4)();
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    let avatarUrl = null;
    if (avatar) {
        const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `parents/${parentId}`);
        avatarUrl = result.url;
    }
    await db_1.db.insert(schema_1.parents).values({
        id: parentId,
        organizationId,
        name,
        phone,
        password: hashedPassword,
        avatar: avatarUrl,
        address: address || null,
        nationalId: nationalId || null,
    });
    (0, response_1.SuccessResponse)(res, { message: "Parent created successfully", parentId }, 201);
};
exports.createParent = createParent;
// ✅ Get All Parents
const getAllParents = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allParents = await db_1.db
        .select({
        id: schema_1.parents.id,
        name: schema_1.parents.name,
        phone: schema_1.parents.phone,
        avatar: schema_1.parents.avatar,
        address: schema_1.parents.address,
        nationalId: schema_1.parents.nationalId,
        status: schema_1.parents.status,
        createdAt: schema_1.parents.createdAt,
        updatedAt: schema_1.parents.updatedAt,
    })
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { parents: allParents }, 200);
};
exports.getAllParents = getAllParents;
// ✅ Get Parent By ID (with students)
const getParentById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const parent = await db_1.db
        .select({
        id: schema_1.parents.id,
        name: schema_1.parents.name,
        phone: schema_1.parents.phone,
        avatar: schema_1.parents.avatar,
        address: schema_1.parents.address,
        nationalId: schema_1.parents.nationalId,
        status: schema_1.parents.status,
        createdAt: schema_1.parents.createdAt,
        updatedAt: schema_1.parents.updatedAt,
    })
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parents.id, id), (0, drizzle_orm_1.eq)(schema_1.parents.organizationId, organizationId)))
        .limit(1);
    if (!parent[0]) {
        throw new NotFound_1.NotFound("Parent not found");
    }
    const parentStudents = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        status: schema_1.students.status,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, id));
    (0, response_1.SuccessResponse)(res, { parent: { ...parent[0], students: parentStudents } }, 200);
};
exports.getParentById = getParentById;
// ✅ Update Parent
const updateParent = async (req, res) => {
    const { id } = req.params;
    const { name, phone, password, avatar, address, nationalId, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingParent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parents.id, id), (0, drizzle_orm_1.eq)(schema_1.parents.organizationId, organizationId)))
        .limit(1);
    if (!existingParent[0]) {
        throw new NotFound_1.NotFound("Parent not found");
    }
    if (phone && phone !== existingParent[0].phone) {
        const phoneExists = await db_1.db
            .select()
            .from(schema_1.parents)
            .where((0, drizzle_orm_1.eq)(schema_1.parents.phone, phone))
            .limit(1);
        if (phoneExists[0]) {
            throw new BadRequest_1.BadRequest("Phone number already registered");
        }
    }
    let hashedPassword = existingParent[0].password;
    if (password) {
        hashedPassword = await bcrypt_1.default.hash(password, 10);
    }
    let avatarUrl = existingParent[0].avatar;
    if (avatar !== undefined) {
        if (existingParent[0].avatar) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingParent[0].avatar);
        }
        if (avatar) {
            const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `parents/${id}`);
            avatarUrl = result.url;
        }
        else {
            avatarUrl = null;
        }
    }
    await db_1.db.update(schema_1.parents).set({
        name: name ?? existingParent[0].name,
        phone: phone ?? existingParent[0].phone,
        password: hashedPassword,
        avatar: avatarUrl,
        address: address !== undefined ? address : existingParent[0].address,
        nationalId: nationalId !== undefined ? nationalId : existingParent[0].nationalId,
        status: status ?? existingParent[0].status,
    }).where((0, drizzle_orm_1.eq)(schema_1.parents.id, id));
    // لو الـ status اتغير لـ inactive، حول كل الـ students لـ inactive
    if (status === "inactive") {
        await db_1.db.update(schema_1.students)
            .set({ status: "inactive" })
            .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, id));
    }
    (0, response_1.SuccessResponse)(res, { message: "Parent updated successfully" }, 200);
};
exports.updateParent = updateParent;
// ✅ Delete Parent
const deleteParent = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingParent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parents.id, id), (0, drizzle_orm_1.eq)(schema_1.parents.organizationId, organizationId)))
        .limit(1);
    if (!existingParent[0]) {
        throw new NotFound_1.NotFound("Parent not found");
    }
    // Check if parent has students
    const parentStudents = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, id))
        .limit(1);
    if (parentStudents[0]) {
        throw new BadRequest_1.BadRequest("Cannot delete parent with students. Delete students first.");
    }
    if (existingParent[0].avatar) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingParent[0].avatar);
    }
    await db_1.db.delete(schema_1.parents).where((0, drizzle_orm_1.eq)(schema_1.parents.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Parent deleted successfully" }, 200);
};
exports.deleteParent = deleteParent;
