"use strict";
// src/constants/admin.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPER_ADMIN_ACTIONS = exports.SUPER_ADMIN_MODULES = exports.ACTION_NAMES = exports.MODULES = void 0;
exports.MODULES = [
    "admins",
    "roles",
    "bus_types",
    "buses",
    "drivers",
    "codrivers",
    "pickup_points",
    "routes",
    "departments",
    "rides",
    "notes",
    "reports",
    "settings",
    "students",
    "parents",
    "City",
    "Zone",
    "feeinstallments",
    "Subscription",
    "invoices",
    "organizationServices",
    "payments",
    "paymentMethods",
    "plans"
];
exports.ACTION_NAMES = ["View", "Add", "Edit", "Delete", "Status"];
// src/constants/superAdminPermissions.ts
exports.SUPER_ADMIN_MODULES = [
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
];
exports.SUPER_ADMIN_ACTIONS = [
    "view",
    "create",
    "update",
    "delete",
    "approve",
    "reject",
    "export",
];
