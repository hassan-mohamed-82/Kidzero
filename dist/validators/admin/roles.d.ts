import { z } from "zod";
export declare const createRoleSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        permissions: z.ZodArray<z.ZodObject<{
            module: z.ZodEnum<["admins", "roles", "bus_types", "buses", "drivers", "codrivers", "pickup_points", "routes", "rides", "notes", "reports", "settings"]>;
            actions: z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                action: z.ZodEnum<["View", "Add", "Edit", "Delete", "Status"]>;
            }, "strip", z.ZodTypeAny, {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }, {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }, {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        permissions: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[];
    }, {
        name: string;
        permissions: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        permissions: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[];
    };
}, {
    body: {
        name: string;
        permissions: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[];
    };
}>;
export declare const updateRoleSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        permissions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            module: z.ZodEnum<["admins", "roles", "bus_types", "buses", "drivers", "codrivers", "pickup_points", "routes", "rides", "notes", "reports", "settings"]>;
            actions: z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                action: z.ZodEnum<["View", "Add", "Edit", "Delete", "Status"]>;
            }, "strip", z.ZodTypeAny, {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }, {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }, {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }>, "many">>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[] | undefined;
    }, {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[] | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        status?: "active" | "inactive" | undefined;
        permissions?: {
            module: "roles" | "admins" | "bus_types" | "buses" | "drivers" | "codrivers" | "pickup_points" | "routes" | "rides" | "notes" | "reports" | "settings";
            actions: {
                action: "View" | "Add" | "Edit" | "Delete" | "Status";
                id?: string | undefined;
            }[];
        }[] | undefined;
    };
}>;
export declare const roleIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
