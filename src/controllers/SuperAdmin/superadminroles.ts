// src/controllers/superadmin/superAdminRoleController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { superAdminRoles } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { SUPER_ADMIN_MODULES, SUPER_ADMIN_ACTIONS } from "../../types/constant";
import { v4 as uuidv4 } from "uuid";

type SuperAdminPermission = {
  module: string;
  actions: { id?: string; action: string }[];
};

// Generate ID للـ Action
const generateActionId = (): string => {
  return uuidv4().replace(/-/g, "").substring(0, 24);
};

// إضافة IDs للـ Actions
const addIdsToPermissions = (permissions: SuperAdminPermission[]): SuperAdminPermission[] => {
  return permissions.map((perm) => ({
    module: perm.module,
    actions: perm.actions.map((act) => ({
      id: act.id || generateActionId(),
      action: act.action,
    })),
  }));
};

// ✅ Get All Roles
export const getAllRoles = async (req: Request, res: Response) => {
  console.log("Getting all super admin roles...");
  
 
    const allRoles = await db.select().from(superAdminRoles);
    console.log("Roles found:", allRoles);
    SuccessResponse(res, { roles: allRoles }, 200);
 
};
// ✅ Get Role By ID
export const getRoleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!role[0]) {
    throw new NotFound("Role not found");
  }

  SuccessResponse(res, { role: role[0] }, 200);
};

// ✅ Create Role
export const createRole = async (req: Request, res: Response) => {
  const { name, permissions } = req.body;

  if (!name) {
    throw new BadRequest("Role name is required");
  }

  const existingRole = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.name, name))
    .limit(1);

  if (existingRole[0]) {
    throw new BadRequest("Role with this name already exists");
  }

  const permissionsWithIds = addIdsToPermissions(permissions || []);
  const roleId = uuidv4();

  await db.insert(superAdminRoles).values({
    id: roleId,
    name,
    permissions: permissionsWithIds,
  });

  SuccessResponse(res, { message: "Role created successfully", roleId }, 201);
};

// ✅ Update Role
export const updateRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, permissions, status } = req.body;

  const existingRole = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!existingRole[0]) {
    throw new NotFound("Role not found");
  }

  if (name && name !== existingRole[0].name) {
    const duplicateName = await db
      .select()
      .from(superAdminRoles)
      .where(eq(superAdminRoles.name, name))
      .limit(1);

    if (duplicateName[0]) {
      throw new BadRequest("Role with this name already exists");
    }
  }

  const updatedPermissions = permissions
    ? addIdsToPermissions(permissions)
    : existingRole[0].permissions;

  await db
    .update(superAdminRoles)
    .set({
      name: name ?? existingRole[0].name,
      permissions: updatedPermissions,
      status: status ?? existingRole[0].status,
    })
    .where(eq(superAdminRoles.id, id));

  SuccessResponse(res, { message: "Role updated successfully" }, 200);
};

// ✅ Delete Role
export const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingRole = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!existingRole[0]) {
    throw new NotFound("Role not found");
  }

  await db.delete(superAdminRoles).where(eq(superAdminRoles.id, id));

  SuccessResponse(res, { message: "Role deleted successfully" }, 200);
};

// ✅ Toggle Role Status
export const toggleRoleStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingRole = await db
    .select()
    .from(superAdminRoles)
    .where(eq(superAdminRoles.id, id))
    .limit(1);

  if (!existingRole[0]) {
    throw new NotFound("Role not found");
  }

  const newStatus = existingRole[0].status === "active" ? "inactive" : "active";

  await db.update(superAdminRoles).set({ status: newStatus }).where(eq(superAdminRoles.id, id));

  SuccessResponse(res, { message: `Role ${newStatus}` }, 200);
};

// ✅ Get Available Permissions (للـ Frontend)
export const getAvailablePermissions = async (req: Request, res: Response) => {
  const permissions = SUPER_ADMIN_MODULES.map((module) => ({
    module,
    actions: SUPER_ADMIN_ACTIONS.map((action) => ({
      id: generateActionId(),
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