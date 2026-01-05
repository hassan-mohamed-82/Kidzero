// src/controllers/roles/roleController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { roles } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";

// ✅ Get All Roles
export const getAllRoles = async (req: Request, res: Response) => {
  const allRoles = await db.select().from(roles);

  SuccessResponse(res, { roles: allRoles }, 200);
};

// ✅ Get Role By ID
export const getRoleById = async (req: Request, res: Response) => {
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
export const createRole = async (req: Request, res: Response) => {
  const { name, permissions } = req.body;

  if (!name) {
    throw new BadRequest("Role name is required");
  }

  await db.insert(roles).values({
    name,
    permissions: permissions || [],
  });

  SuccessResponse(res, { message: "Role created successfully" }, 201);
};

// ✅ Update Role
export const updateRole = async (req: Request, res: Response) => {
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

  await db
    .update(roles)
    .set({
      name: name || existingRole[0].name,
      permissions: permissions || existingRole[0].permissions,
      status: status || existingRole[0].status,
    })
    .where(eq(roles.id, id));

  SuccessResponse(res, { message: "Role updated successfully" }, 200);
};

// ✅ Delete Role
export const deleteRole = async (req: Request, res: Response) => {
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
export const toggleRoleStatus = async (req: Request, res: Response) => {
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
