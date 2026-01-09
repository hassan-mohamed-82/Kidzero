// src/constants/admin.ts

export const MODULES = [
  "admins",
  "roles",
  "bus_types",
  "buses",
  "drivers",
  "codrivers",
  "pickup_points",
  "routes",
  "rides",
  "notes",
  "reports",
  "settings",
] as const;

export const ACTION_NAMES = ["View", "Add", "Edit", "Delete", "Status"] as const;

export type ModuleName = (typeof MODULES)[number];
export type ActionName = (typeof ACTION_NAMES)[number];



// src/constants/superAdminPermissions.ts

export const SUPER_ADMIN_MODULES = [
  "organizations",
  "plans", 
  "payments",
  "subscriptions",
  "payment_methods",
  "promocodes",
  "reports",
  "sub_admins",
  "super_admin_roles",
  "settings",
] as const;

export const SUPER_ADMIN_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "export",
] as const;

export type SuperAdminModule = (typeof SUPER_ADMIN_MODULES)[number];
export type SuperAdminAction = (typeof SUPER_ADMIN_ACTIONS)[number];