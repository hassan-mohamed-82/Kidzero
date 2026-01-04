import { RequestHandler } from "express";
type Role = "superadmin" | "organization" | "driver" | "codriver" | "student";
export declare const authorizeRoles: (...roles: Role[]) => RequestHandler;
export {};
