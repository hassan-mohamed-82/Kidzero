// src/controllers/admin/roleController.ts
import { db } from "../../models/db";
import { roles } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { MODULES, ACTION_NAMES } from "../../types/constant";
import { v4 as uuidv4 } from "uuid";
// Generate ID للـ Action
const generateActionId = () => {
    return uuidv4().replace(/-/g, "").substring(0, 24);
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
// ✅ Get All Roles
export const getAllRoles = async (req, res) => {
    const allRoles = await db.select().from(roles);
    SuccessResponse(res, { roles: allRoles }, 200);
};
// ✅ Get Role By ID
export const getRoleById = async (req, res) => {
    const { id } = req.params;
    const role = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
    if (!role[0]) {
        throw new NotFound("Role not found");
    }
    SuccessResponse(res, { role: role[0] }, 200);
};
// ✅ Create Role
export const createRole = async (req, res) => {
    const { name, permissions } = req.body;
    if (!name) {
        throw new BadRequest("Role name is required");
    }
    // تحقق من عدم وجود role بنفس الاسم
    const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);
    if (existingRole[0]) {
        throw new BadRequest("Role with this name already exists");
    }
    // إضافة IDs للـ Actions
    const permissionsWithIds = addIdsToPermissions(permissions || []);
    await db.insert(roles).values({
        name,
        permissions: permissionsWithIds,
    });
    SuccessResponse(res, { message: "Role created successfully" }, 201);
};
// ✅ Update Role
export const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, permissions, status } = req.body;
    const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
    if (!existingRole[0]) {
        throw new NotFound("Role not found");
    }
    // لو بيغير الاسم، نتحقق إنه مش موجود
    if (name && name !== existingRole[0].name) {
        const duplicateName = await db
            .select()
            .from(roles)
            .where(eq(roles.name, name))
            .limit(1);
        if (duplicateName[0]) {
            throw new BadRequest("Role with this name already exists");
        }
    }
    // إضافة IDs للـ Actions الجديدة
    const updatedPermissions = permissions
        ? addIdsToPermissions(permissions)
        : existingRole[0].permissions;
    await db
        .update(roles)
        .set({
        name: name ?? existingRole[0].name,
        permissions: updatedPermissions,
        status: status ?? existingRole[0].status,
    })
        .where(eq(roles.id, id));
    SuccessResponse(res, { message: "Role updated successfully" }, 200);
};
// ✅ Delete Role
export const deleteRole = async (req, res) => {
    const { id } = req.params;
    const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
    if (!existingRole[0]) {
        throw new NotFound("Role not found");
    }
    await db.delete(roles).where(eq(roles.id, id));
    SuccessResponse(res, { message: "Role deleted successfully" }, 200);
};
// ✅ Toggle Role Status
export const toggleRoleStatus = async (req, res) => {
    const { id } = req.params;
    const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
    if (!existingRole[0]) {
        throw new NotFound("Role not found");
    }
    const newStatus = existingRole[0].status === "active" ? "inactive" : "active";
    await db.update(roles).set({ status: newStatus }).where(eq(roles.id, id));
    SuccessResponse(res, { message: `Role ${newStatus}` }, 200);
};
// ✅ Get Available Permissions (للـ Frontend)
export const getAvailablePermissions = async (req, res) => {
    const permissions = MODULES.map((module) => ({
        module,
        actions: ACTION_NAMES.map((action) => ({
            id: generateActionId(),
            action,
        })),
    }));
    SuccessResponse(res, {
        modules: MODULES,
        actions: ACTION_NAMES,
        permissions,
    }, 200);
};
//# sourceMappingURL=roles.js.map