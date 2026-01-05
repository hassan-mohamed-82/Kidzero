// src/constants/permissions.ts

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
