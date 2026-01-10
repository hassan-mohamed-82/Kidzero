"use strict";
// src/controllers/superadmin/subAdminController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSubAdminStatus = exports.deleteSubAdmin = exports.updateSubAdmin = exports.createSubAdmin = exports.getSubAdminById = exports.getAllSubAdmins = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Helper لـ Parse الـ Permissions
const parsePermissions = (permissions) => {
    if (typeof permissions === "string") {
        try {
            return JSON.parse(permissions);
        }
        catch {
            return [];
        }
    }
    return permissions || [];
};
// ✅ Get All SubAdmins
const getAllSubAdmins = async (req, res) => {
    const allSubAdmins = await db_1.db
        .select({
        id: schema_1.superAdmins.id,
        name: schema_1.superAdmins.name,
        email: schema_1.superAdmins.email,
        role: schema_1.superAdmins.role,
        roleId: schema_1.superAdmins.roleId,
        status: schema_1.superAdmins.status,
        createdAt: schema_1.superAdmins.createdAt,
        updatedAt: schema_1.superAdmins.updatedAt,
        roleDetails: {
            id: schema_1.superAdminRoles.id,
            name: schema_1.superAdminRoles.name,
            permissions: schema_1.superAdminRoles.permissions,
        },
    })
        .from(schema_1.superAdmins)
        .leftJoin(schema_1.superAdminRoles, (0, drizzle_orm_1.eq)(schema_1.superAdmins.roleId, schema_1.superAdminRoles.id))
        .where((0, drizzle_orm_1.eq)(schema_1.superAdmins.role, "subadmin"));
    // Parse permissions
    const subAdminsWithParsedPermissions = allSubAdmins.map((admin) => ({
        ...admin,
        roleDetails: admin.roleDetails
            ? {
                ...admin.roleDetails,
                permissions: parsePermissions(admin.roleDetails.permissions),
            }
            : null,
    }));
    (0, response_1.SuccessResponse)(res, { subAdmins: subAdminsWithParsedPermissions }, 200);
};
exports.getAllSubAdmins = getAllSubAdmins;
// ✅ Get SubAdmin By ID
const getSubAdminById = async (req, res) => {
    const { id } = req.params;
    const subAdmin = await db_1.db
        .select({
        id: schema_1.superAdmins.id,
        name: schema_1.superAdmins.name,
        email: schema_1.superAdmins.email,
        role: schema_1.superAdmins.role,
        roleId: schema_1.superAdmins.roleId,
        status: schema_1.superAdmins.status,
        createdAt: schema_1.superAdmins.createdAt,
        updatedAt: schema_1.superAdmins.updatedAt,
        roleDetails: {
            id: schema_1.superAdminRoles.id,
            name: schema_1.superAdminRoles.name,
            permissions: schema_1.superAdminRoles.permissions,
        },
    })
        .from(schema_1.superAdmins)
        .leftJoin(schema_1.superAdminRoles, (0, drizzle_orm_1.eq)(schema_1.superAdmins.roleId, schema_1.superAdminRoles.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, id), (0, drizzle_orm_1.eq)(schema_1.superAdmins.role, "subadmin")))
        .limit(1);
    if (!subAdmin[0]) {
        throw new NotFound_1.NotFound("SubAdmin not found");
    }
    // Parse permissions
    const subAdminWithParsedPermissions = {
        ...subAdmin[0],
        roleDetails: subAdmin[0].roleDetails
            ? {
                ...subAdmin[0].roleDetails,
                permissions: parsePermissions(subAdmin[0].roleDetails.permissions),
            }
            : null,
    };
    (0, response_1.SuccessResponse)(res, { subAdmin: subAdminWithParsedPermissions }, 200);
};
exports.getSubAdminById = getSubAdminById;
// ✅ Create SubAdmin
const createSubAdmin = async (req, res) => {
    const { name, email, password, roleId } = req.body;
    if (!name || !email || !password) {
        throw new BadRequest_1.BadRequest("Name, email and password are required");
    }
    // تحقق من عدم وجود email مكرر
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.superAdmins)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdmins.email, email))
        .limit(1);
    if (existingAdmin[0]) {
        throw new BadRequest_1.BadRequest("Email already exists");
    }
    // لو فيه roleId، نتحقق إنه موجود
    if (roleId) {
        const role = await db_1.db
            .select()
            .from(schema_1.superAdminRoles)
            .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, roleId))
            .limit(1);
        if (!role[0]) {
            throw new BadRequest_1.BadRequest("Role not found");
        }
    }
    // Hash الـ password
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    await db_1.db.insert(schema_1.superAdmins).values({
        name,
        email,
        passwordHashed: hashedPassword,
        role: "subadmin",
        roleId: roleId || null,
        status: "active",
    });
    (0, response_1.SuccessResponse)(res, { message: "SubAdmin created successfully" }, 201);
};
exports.createSubAdmin = createSubAdmin;
// ✅ Update SubAdmin
const updateSubAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, roleId, status } = req.body;
    // تحقق من وجود الـ SubAdmin
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.superAdmins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, id), (0, drizzle_orm_1.eq)(schema_1.superAdmins.role, "subadmin")))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new NotFound_1.NotFound("SubAdmin not found");
    }
    // لو بيغير الـ email، نتحقق إنه مش موجود
    if (email && email !== existingAdmin[0].email) {
        const duplicateEmail = await db_1.db
            .select()
            .from(schema_1.superAdmins)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.superAdmins.email, email), (0, drizzle_orm_1.ne)(schema_1.superAdmins.id, id)))
            .limit(1);
        if (duplicateEmail[0]) {
            throw new BadRequest_1.BadRequest("Email already exists");
        }
    }
    // لو فيه roleId جديد، نتحقق إنه موجود
    if (roleId) {
        const role = await db_1.db
            .select()
            .from(schema_1.superAdminRoles)
            .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, roleId))
            .limit(1);
        if (!role[0]) {
            throw new BadRequest_1.BadRequest("Role not found");
        }
    }
    // تجهيز البيانات للتحديث
    const updateData = {
        name: name ?? existingAdmin[0].name,
        email: email ?? existingAdmin[0].email,
        roleId: roleId !== undefined ? roleId : existingAdmin[0].roleId,
        status: status ?? existingAdmin[0].status,
    };
    // لو فيه password جديد
    if (password) {
        updateData.passwordHashed = await bcrypt_1.default.hash(password, 10);
    }
    await db_1.db.update(schema_1.superAdmins).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, id));
    (0, response_1.SuccessResponse)(res, { message: "SubAdmin updated successfully" }, 200);
};
exports.updateSubAdmin = updateSubAdmin;
// ✅ Delete SubAdmin
const deleteSubAdmin = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    // منع حذف النفس
    if (id === currentUserId) {
        throw new BadRequest_1.BadRequest("You cannot delete yourself");
    }
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.superAdmins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, id), (0, drizzle_orm_1.eq)(schema_1.superAdmins.role, "subadmin")))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new NotFound_1.NotFound("SubAdmin not found");
    }
    await db_1.db.delete(schema_1.superAdmins).where((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, id));
    (0, response_1.SuccessResponse)(res, { message: "SubAdmin deleted successfully" }, 200);
};
exports.deleteSubAdmin = deleteSubAdmin;
// ✅ Toggle SubAdmin Status
const toggleSubAdminStatus = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    // منع تغيير حالة النفس
    if (id === currentUserId) {
        throw new BadRequest_1.BadRequest("You cannot change your own status");
    }
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.superAdmins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, id), (0, drizzle_orm_1.eq)(schema_1.superAdmins.role, "subadmin")))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new NotFound_1.NotFound("SubAdmin not found");
    }
    const newStatus = existingAdmin[0].status === "active" ? "inactive" : "active";
    await db_1.db
        .update(schema_1.superAdmins)
        .set({ status: newStatus })
        .where((0, drizzle_orm_1.eq)(schema_1.superAdmins.id, id));
    (0, response_1.SuccessResponse)(res, { message: `SubAdmin ${newStatus}` }, 200);
};
exports.toggleSubAdminStatus = toggleSubAdminStatus;
