export declare const MODULES: readonly ["admins", "roles", "bus_types", "buses", "drivers", "codrivers", "pickup_points", "routes", "rides", "notes", "reports", "settings"];
export declare const ACTION_NAMES: readonly ["View", "Add", "Edit", "Delete", "Status"];
export type ModuleName = (typeof MODULES)[number];
export type ActionName = (typeof ACTION_NAMES)[number];
