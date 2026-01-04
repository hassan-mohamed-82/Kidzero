import { RequestHandler } from "express";
export declare const authorizeRoles: (...roles: string[]) => RequestHandler;
