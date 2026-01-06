import { Request, Response } from "express";
export declare const getAllAdmins: (req: Request, res: Response) => Promise<void>;
export declare const getAdminById: (req: Request, res: Response) => Promise<void>;
export declare const createAdmin: (req: Request, res: Response) => Promise<void>;
export declare const updateAdmin: (req: Request, res: Response) => Promise<void>;
export declare const deleteAdmin: (req: Request, res: Response) => Promise<void>;
