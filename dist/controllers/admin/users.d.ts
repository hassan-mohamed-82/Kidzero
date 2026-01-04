import { Request, Response } from "express";
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUser: (req: Request, res: Response) => Promise<void>;
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
export declare const approveUser: (req: Request, res: Response) => Promise<void>;
export declare const rejectUser: (req: Request, res: Response) => Promise<void>;
export declare const getAllRejectedUsers: (req: Request, res: Response) => Promise<void>;
export declare const getAllPendingUsers: (req: Request, res: Response) => Promise<void>;
