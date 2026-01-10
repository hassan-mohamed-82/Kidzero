// src/types/custom.ts

import { ModuleName, ActionName } from "../constants/permissions";

export interface PermissionAction {
    id?: string;  // ✅ optional
    action: ActionName;
}

export interface Permission {
    module: ModuleName;
    actions: PermissionAction[];
}

export type SuperAdminType = "superadmin" | "subadmin";
export type AdminType = "organizer" | "admin";
export type MobileUserType = "driver" | "codriver" | "parent";
export type Role = SuperAdminType | AdminType | MobileUserType;

export interface TokenPayload {
    id: string;
    name: string;
    role: Role;
    organizationId?: string;
    permissions?: Permission[];
}

export type AppUser = TokenPayload;

declare global {
    namespace Express {
        interface Request {
            user?: AppUser;
        }
    }
}