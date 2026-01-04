export declare const MODULES: readonly ["students", "trips", "buses", "drivers", "parents", "pickup_points", "attendance", "reports", "users", "roles", "settings"];
export declare const ACTIONS: readonly ["view", "add", "edit", "delete", "status"];
export type ModuleName = (typeof MODULES)[number];
export type ActionName = (typeof ACTIONS)[number];
export declare const ALL_PERMISSIONS: string[];
