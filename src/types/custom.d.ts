// src/types/custom.ts

import { Request } from "express";
import { ModuleName, ActionName } from "./constant";

// Permission Action
export type PermissionAction = {
  id: string;
  action: ActionName;
};

// Permission (module + actions)
export type Permission = {
  module: ModuleName;
  actions: PermissionAction[];
};

// Super Admin (أنت - البائع)
export type SuperAdminType = "superadmin";

// Website Users (جوه Organization)
// organizer = صاحب المؤسسة (كل الصلاحيات)
// admin = موظف (Role + Permissions)
export type AdminType = "organizer" | "admin";

// Mobile App Users
export type MobileUserType = "driver" | "codriver";

// All Roles
export type Role = SuperAdminType | AdminType | MobileUserType;

// Token Payload
export interface TokenPayload {
  id: string;
  name: string;
  role: Role;
  organizationId?: string; // SuperAdmin مش هيكون عنده organizationId
}

export type AppUser = TokenPayload;

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}
