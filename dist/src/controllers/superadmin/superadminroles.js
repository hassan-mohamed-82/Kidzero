"use strict";
// src/controllers/superadmin/superAdminRoleController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailablePermissions = exports.toggleRoleStatus = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getAllRoles = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const constant_1 = require("../../types/constant");
const uuid_1 = require("uuid");
// Generate ID للـ Action
const generateActionId = () => {
    return (0, uuid_1.v4)().replace(/-/g, "").substring(0, 24);
};
// إضافة IDs للـ Actions
const addIdsToPermissions = (permissions) => {
    return permissions.map((perm) => ({
        module: perm.module,
        actions: perm.actions.map((act) => ({
            id: act.id || generateActionId(),
            action: act.action,
        })),
    }));
};
// ✅ Helper: Check if permissions need IDs
const permissionsNeedIds = (permissions) => {
    if (!permissions || !Array.isArray(permissions))
        return false;
    for (const perm of permissions) {
        for (const act of perm.actions || []) {
            if (!act.id)
                return true;
        }
    }
    return false;
};
// ✅ Get All Roles
const getAllRoles = async (req, res) => {
    const allRoles = await db_1.db.select().from(schema_1.superAdminRoles);
    const rolesWithFixedPermissions = [];
    for (const role of allRoles) {
        let permissions = role.permissions || [];
        // ✅ لو فيه Actions بدون IDs، أضفها واحفظها
        if (permissionsNeedIds(permissions)) {
            permissions = addIdsToPermissions(permissions);
            await db_1.db
                .update(schema_1.superAdminRoles)
                .set({ permissions })
                .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, role.id));
        }
        rolesWithFixedPermissions.push({
            id: role.id,
            name: role.name,
            permissions,
            status: role.status,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        });
    }
    (0, response_1.SuccessResponse)(res, { roles: rolesWithFixedPermissions }, 200);
};
exports.getAllRoles = getAllRoles;
// ✅ Get Role By ID
const getRoleById = async (req, res) => {
    const { id } = req.params;
    const [role] = await db_1.db
        .select()
        .from(schema_1.superAdminRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id))
        .limit(1);
    if (!role) {
        throw new NotFound_1.NotFound("Role not found");
    }
    let permissions = role.permissions || [];
    // لو فيه Actions بدون IDs، أضفها واحفظها
    if (permissionsNeedIds(permissions)) {
        permissions = addIdsToPermissions(permissions);
        await db_1.db
            .update(schema_1.superAdminRoles)
            .set({ permissions })
            .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, role.id));
    }
    (0, response_1.SuccessResponse)(res, {
        role: {
            id: role.id,
            name: role.name,
            permissions,
            status: role.status,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        },
    }, 200);
};
exports.getRoleById = getRoleById;
// ✅ Create Role
const createRole = async (req, res) => {
    const { name, permissions } = req.body;
    if (!name) {
        throw new BadRequest_1.BadRequest("Role name is required");
    }
    const [existingRole] = await db_1.db
        .select()
        .from(schema_1.superAdminRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.name, name))
        .limit(1);
    if (existingRole) {
        throw new BadRequest_1.BadRequest("Role with this name already exists");
    }
    const permissionsWithIds = addIdsToPermissions(permissions || []);
    const roleId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.superAdminRoles).values({
        id: roleId,
        name,
        permissions: permissionsWithIds,
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Role created successfully",
        role: {
            id: roleId,
            name,
            permissions: permissionsWithIds,
        },
    }, 201);
};
exports.createRole = createRole;
// ✅ Update Role
const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, permissions, status } = req.body;
    const [existingRole] = await db_1.db
        .select()
        .from(schema_1.superAdminRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id))
        .limit(1);
    if (!existingRole) {
        throw new NotFound_1.NotFound("Role not found");
    }
    if (name && name !== existingRole.name) {
        const [duplicateName] = await db_1.db
            .select()
            .from(schema_1.superAdminRoles)
            .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.name, name))
            .limit(1);
        if (duplicateName) {
            throw new BadRequest_1.BadRequest("Role with this name already exists");
        }
    }
    const updateData = {};
    if (name !== undefined) {
        updateData.name = name;
    }
    if (status !== undefined) {
        updateData.status = status;
    }
    if (permissions !== undefined) {
        updateData.permissions = addIdsToPermissions(permissions);
    }
    await db_1.db
        .update(schema_1.superAdminRoles)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id));
    const [updatedRole] = await db_1.db
        .select()
        .from(schema_1.superAdminRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id))
        .limit(1);
    (0, response_1.SuccessResponse)(res, {
        message: "Role updated successfully",
        role: {
            id: updatedRole.id,
            name: updatedRole.name,
            permissions: updatedRole.permissions,
            status: updatedRole.status,
            createdAt: updatedRole.createdAt,
            updatedAt: updatedRole.updatedAt,
        },
    }, 200);
};
exports.updateRole = updateRole;
// ✅ Delete Role
const deleteRole = async (req, res) => {
    const { id } = req.params;
    const [existingRole] = await db_1.db
        .select()
        .from(schema_1.superAdminRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id))
        .limit(1);
    if (!existingRole) {
        throw new NotFound_1.NotFound("Role not found");
    }
    await db_1.db.delete(schema_1.superAdminRoles).where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Role deleted successfully" }, 200);
};
exports.deleteRole = deleteRole;
// ✅ Toggle Role Status
const toggleRoleStatus = async (req, res) => {
    const { id } = req.params;
    const [existingRole] = await db_1.db
        .select()
        .from(schema_1.superAdminRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id))
        .limit(1);
    if (!existingRole) {
        throw new NotFound_1.NotFound("Role not found");
    }
    const newStatus = existingRole.status === "active" ? "inactive" : "active";
    await db_1.db
        .update(schema_1.superAdminRoles)
        .set({ status: newStatus })
        .where((0, drizzle_orm_1.eq)(schema_1.superAdminRoles.id, id));
    (0, response_1.SuccessResponse)(res, {
        message: `Role ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
        status: newStatus,
    }, 200);
};
exports.toggleRoleStatus = toggleRoleStatus;
// ✅ Get Available Permissions
const getAvailablePermissions = async (req, res) => {
    const permissions = constant_1.SUPER_ADMIN_MODULES.map((module) => ({
        module,
        actions: constant_1.SUPER_ADMIN_ACTIONS.map((action) => ({
            action,
        })),
    }));
    (0, response_1.SuccessResponse)(res, {
        modules: constant_1.SUPER_ADMIN_MODULES,
        actions: constant_1.SUPER_ADMIN_ACTIONS,
        permissions,
    }, 200);
};
exports.getAvailablePermissions = getAvailablePermissions;
