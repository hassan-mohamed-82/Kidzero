import { Request, Response } from "express";
export declare const getAllRoles: (req: Request, res: Response) => Promise<void>;
export declare const getRoleById: (req: Request, res: Response) => Promise<void>;
export declare const createRole: (req: Request, res: Response) => Promise<void>;
export declare const updateRole: (req: Request, res: Response) => Promise<void>;
export declare const deleteRole: (req: Request, res: Response) => Promise<void>;
