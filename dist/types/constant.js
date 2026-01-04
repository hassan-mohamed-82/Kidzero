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
];
export const ACTIONS = ["view", "add", "edit", "delete", "status"];
// Helper لإنشاء كل الصلاحيات
export const ALL_PERMISSIONS = MODULES.flatMap((module) => ACTIONS.map((action) => `${module}.${action}`));
//# sourceMappingURL=constant.js.map