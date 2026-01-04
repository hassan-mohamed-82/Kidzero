// src/constants/permissions.ts

export const MODULES = [
  "students",
  "trips",
  "buses",
  "drivers",
  "parents",
  "pickup_points",
  "attendance",
  "reports",
  "users",
  "roles",
  "settings",
] as const;

export const ACTIONS = ["view", "add", "edit", "delete", "status"] as const;

export type ModuleName = (typeof MODULES)[number];
export type ActionName = (typeof ACTIONS)[number];

// Helper لإنشاء كل الصلاحيات
export const ALL_PERMISSIONS = MODULES.flatMap((module) =>
  ACTIONS.map((action) => `${module}.${action}`)
);
