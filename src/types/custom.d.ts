// src/types/index.ts

import { Request } from "express";
import { ModuleName, ActionName } from "../constants/permissions";

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

// User Types
export type UserType = "driver" | "codriver" | "parent";
export type AdminType = "superadmin" | "organization";
export type Role = AdminType | UserType;

// Token Payload
export interface TokenPayload {
  id: string;
  name: string;
  role: Role;
  organizationId?: string;
}

export type AppUser = TokenPayload;

export interface AuthenticatedRequest extends Request {
  user?: AppUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}
