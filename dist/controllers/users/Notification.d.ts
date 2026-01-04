import { Request, Response } from "express";
export declare const getAllNotifications: (req: Request, res: Response) => Promise<void>;
export declare const getUnseenCount: (req: Request, res: Response) => Promise<void>;
export declare const getNotificationById: (req: Request, res: Response) => Promise<void>;
