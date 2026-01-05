// src/types/custom.ts

import { ModuleName, ActionName } from "./constant";

export interface PermissionAction {
  id: string;
  action: ActionName;
}

export interface Permission {
  module: ModuleName;
  actions: PermissionAction[];
}

export type SuperAdminType = "superadmin";
export type AdminType = "organizer" | "admin";
export type MobileUserType = "driver" | "codriver";
export type Role = SuperAdminType | AdminType | MobileUserType;

export interface TokenPayload {
  id: string;
  name: string;
  role: Role;
  organizationId?: string; // 👈 optional عشان SuperAdmin مش عنده
}

export type AppUser = TokenPayload;

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}
