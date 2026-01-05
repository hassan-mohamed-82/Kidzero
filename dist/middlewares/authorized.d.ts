import { RequestHandler } from "express";
type Role = "superadmin" | "admin" | "driver" | "codriver" | "student" | "organizer";
export declare const authorizeRoles: (...roles: Role[]) => RequestHandler;
export {};
