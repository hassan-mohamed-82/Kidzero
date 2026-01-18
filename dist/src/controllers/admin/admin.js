"use strict";
// src/controllers/admin/adminController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleNames = exports.deleteAdmin = exports.updateAdmin = exports.createAdmin = exports.getAdminById = exports.getAllAdmins = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const bcrypt_1 = __importDefault(require("bcrypt"));
// ✅ Get All Admins (للـ Organization الحالية)
const getAllAdmins = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allAdmins = await db_1.db
        .select({
        id: schema_1.admins.id,
        organizationId: schema_1.admins.organizationId,
        roleId: schema_1.admins.roleId,
        name: schema_1.admins.name,
        email: schema_1.admins.email,
        phone: schema_1.admins.phone,
        avatar: schema_1.admins.avatar,
        type: schema_1.admins.type,
        status: schema_1.admins.status,
        createdAt: schema_1.admins.createdAt,
        updatedAt: schema_1.admins.updatedAt,
    })
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { admins: allAdmins }, 200);
};
exports.getAllAdmins = getAllAdmins;
// ✅ Get Admin By ID (مع الـ Role Details)
const getAdminById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const admin = await db_1.db
        .select({
        id: schema_1.admins.id,
        organizationId: schema_1.admins.organizationId,
        name: schema_1.admins.name,
        email: schema_1.admins.email,
        phone: schema_1.admins.phone,
        avatar: schema_1.admins.avatar,
        type: schema_1.admins.type,
        permissions: schema_1.admins.permissions,
        status: schema_1.admins.status,
        createdAt: schema_1.admins.createdAt,
        updatedAt: schema_1.admins.updatedAt,
        role: {
            id: schema_1.roles.id,
            name: schema_1.roles.name,
            permissions: schema_1.roles.permissions,
        },
    })
        .from(schema_1.admins)
        .leftJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.admins.roleId, schema_1.roles.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!admin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    (0, response_1.SuccessResponse)(res, { admin: admin[0] }, 200);
};
exports.getAdminById = getAdminById;
// ✅ Create Admin
const createAdmin = async (req, res) => {
    const { name, email, password, phone, avatar, roleId, type } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // تحقق من عدم وجود admin بنفس الـ email
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.email, email))
        .limit(1);
    if (existingAdmin[0]) {
        throw new BadRequest_1.BadRequest("Email already exists");
    }
    // لو فيه roleId، نتحقق إنه موجود
    if (roleId) {
        const role = await db_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId))
            .limit(1);
        if (!role[0]) {
            throw new BadRequest_1.BadRequest("Role not found");
        }
    }
    // Hash الـ password
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    await db_1.db.insert(schema_1.admins).values({
        organizationId,
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        avatar: avatar || null,
        roleId: roleId || null,
        type: type || "admin",
    });
    (0, response_1.SuccessResponse)(res, { message: "Admin created successfully" }, 201);
};
exports.createAdmin = createAdmin;
// ✅ Update Admin
const updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, phone, avatar, roleId, type, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // تحقق من وجود الـ Admin
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    // لو بيغير الـ email، نتحقق إنه مش موجود
    if (email && email !== existingAdmin[0].email) {
        const duplicateEmail = await db_1.db
            .select()
            .from(schema_1.admins)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.email, email), (0, drizzle_orm_1.ne)(schema_1.admins.id, id)))
            .limit(1);
        if (duplicateEmail[0]) {
            throw new BadRequest_1.BadRequest("Email already exists");
        }
    }
    // لو فيه roleId جديد، نتحقق إنه موجود
    if (roleId) {
        const role = await db_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId))
            .limit(1);
        if (!role[0]) {
            throw new BadRequest_1.BadRequest("Role not found");
        }
    }
    // تجهيز البيانات للتحديث
    const updateData = {
        name: name ?? existingAdmin[0].name,
        email: email ?? existingAdmin[0].email,
        phone: phone !== undefined ? phone : existingAdmin[0].phone,
        avatar: avatar !== undefined ? avatar : existingAdmin[0].avatar,
        roleId: roleId !== undefined ? roleId : existingAdmin[0].roleId,
        type: type ?? existingAdmin[0].type,
        status: status ?? existingAdmin[0].status,
    };
    // لو فيه password جديد
    if (password) {
        updateData.password = await bcrypt_1.default.hash(password, 10);
    }
    await db_1.db.update(schema_1.admins).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.admins.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Admin updated successfully" }, 200);
};
exports.updateAdmin = updateAdmin;
// ✅ Delete Admin
const deleteAdmin = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // منع حذف النفس
    if (id === currentUserId) {
        throw new BadRequest_1.BadRequest("You cannot delete yourself");
    }
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.id, id), (0, drizzle_orm_1.eq)(schema_1.admins.organizationId, organizationId)))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new NotFound_1.NotFound("Admin not found");
    }
    await db_1.db.delete(schema_1.admins).where((0, drizzle_orm_1.eq)(schema_1.admins.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Admin deleted successfully" }, 200);
};
exports.deleteAdmin = deleteAdmin;
// ✅ Get Role Names Only
const getRoleNames = async (req, res) => {
    const allRoles = await db_1.db
        .select({
        id: schema_1.roles.id,
        name: schema_1.roles.name,
    })
        .from(schema_1.roles)
        .where((0, drizzle_orm_1.eq)(schema_1.roles.status, "active")); // الـ Active بس
    return (0, response_1.SuccessResponse)(res, { roles: allRoles }, 200);
};
exports.getRoleNames = getRoleNames;
