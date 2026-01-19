// src/controllers/superadmin/superAdminRoleController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { superAdminRoles, SuperAdminPermission } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { SUPER_ADMIN_MODULES, SUPER_ADMIN_ACTIONS } from "../../types/constant";
import { v4 as uuidv4 } from "uuid";

// Generate ID للـ Action
const generateActionId = (): string => {
  return uuidv4().replace(/-/g, "").substring(0, 24);
};

// إضافة IDs للـ Actions
const addIdsToPermissions = (
  permissions: SuperAdminPermission[]
): SuperAdminPermission[] => {
  return permissions.map((perm) => ({
    module: perm.module,
    actions: perm.actions.map((act) => ({
      id: act.id || generateActionId(),
      action: act.action,
    })),
  }));
};

// ✅ Helper: Check if permissions need IDs
const permissionsNeedIds = (permissions: SuperAdminPermission[]): boolean => {
  if (!permissions || !Array.isArray(permissions)) return false;
  
  for (const perm of permissions) {
    for (const act of perm.actions || []) {
      if (!act.id) return true;
    }
  }
  return false;
};

// ✅ Get All Roles
export const getAllRoles = async (req: Request, res: Response) => {
  const allRoles = await db.select().from(superAdminRoles);

  const rolesWithFixedPermissions = [];

  for (const role of allRoles) {
    let permissions = role.permissions || [];

    // ✅ لو فيه Actions بدون IDs، أضفها واحفظها
    if (permissionsNeedIds(permissions)) {
      permissions = addIdsToPermissions(permissions);

      await db
        .update(superAdminRoles)
        .set({ permissions })
        .where(eq(superAdminRoles.id, role.id));
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

  SuccessResponse(res, { roles: rolesWithFixedPermissions }, 200);
};

// ✅ Get Role By ID
export const getRoleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const [role] = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!role) {
    throw new NotFound("Role not found");
  }

  let permissions = role.permissions || [];

  // ✅ لو فيه Actions بدون IDs، أضفها واحفظها
  if (permissionsNeedIds(permissions)) {
    permissions = addIdsToPermissions(permissions);

    await db
      .update(superAdminRoles)
      .set({ permissions })
      .where(eq(superAdminRoles.id, id));
  }

  SuccessResponse(
    res,
    {
      role: {
        id: role.id,
        name: role.name,
        permissions,
        status: role.status,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    },
    200
  );
};

// ✅ Create Role
export const createRole = async (req: Request, res: Response) => {
  const { name, permissions } = req.body;

  if (!name) {
    throw new BadRequest("Role name is required");
  }

  const [existingRole] = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.name, name))
    .limit(1);

  if (existingRole) {
    throw new BadRequest("Role with this name already exists");
  }

  const permissionsWithIds = addIdsToPermissions(permissions || []);
  const roleId = uuidv4();

  await db.insert(superAdminRoles).values({
    id: roleId,
    name,
    permissions: permissionsWithIds,
  });

  SuccessResponse(
    res,
    {
      message: "Role created successfully",
      role: {
        id: roleId,
        name,
        permissions: permissionsWithIds,
      },
    },
    201
  );
};

// ✅ Update Role
export const updateRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, permissions, status } = req.body;

  const [existingRole] = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!existingRole) {
    throw new NotFound("Role not found");
  }

  if (name && name !== existingRole.name) {
    const [duplicateName] = await db
      .select()
      .from(superAdminRoles)
      .where(eq(superAdminRoles.name, name))
      .limit(1);

    if (duplicateName) {
      throw new BadRequest("Role with this name already exists");
    }
  }

  const updateData: any = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (status !== undefined) {
    updateData.status = status;
  }

  if (permissions !== undefined) {
    updateData.permissions = addIdsToPermissions(permissions);
  }

  await db
    .update(superAdminRoles)
    .set(updateData)
    .where(eq(superAdminRoles.id, id));

  const [updatedRole] = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  SuccessResponse(
    res,
    {
      message: "Role updated successfully",
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        permissions: updatedRole.permissions,
        status: updatedRole.status,
        createdAt: updatedRole.createdAt,
        updatedAt: updatedRole.updatedAt,
      },
    },
    200
  );
};

// ✅ Delete Role
export const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params;

  const [existingRole] = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!existingRole) {
    throw new NotFound("Role not found");
  }

  await db.delete(superAdminRoles).where(eq(superAdminRoles.id, id));

  SuccessResponse(res, { message: "Role deleted successfully" }, 200);
};

// ✅ Toggle Role Status
export const toggleRoleStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  const [existingRole] = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!existingRole) {
    throw new NotFound("Role not found");
  }

  const newStatus = existingRole.status === "active" ? "inactive" : "active";

  await db
    .update(superAdminRoles)
    .set({ status: newStatus })
    .where(eq(superAdminRoles.id, id));

  SuccessResponse(
    res,
    {
      message: `Role ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      status: newStatus,
    },
    200
  );
};

// ✅ Get Available Permissions
export const getAvailablePermissions = async (req: Request, res: Response) => {
  const permissions = SUPER_ADMIN_MODULES.map((module) => ({
    module,
    actions: SUPER_ADMIN_ACTIONS.map((action) => ({
      action,
    })),
  }));

  SuccessResponse(
    res,
    {
      modules: SUPER_ADMIN_MODULES,
      actions: SUPER_ADMIN_ACTIONS,
      permissions,
    },
    200
  );
};
