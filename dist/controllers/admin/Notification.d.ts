import { Request, Response } from "express";
export declare const sendNotificationToAll: (req: Request, res: Response) => Promise<void>;
export declare const testFCMSetup: (req: Request, res: Response) => Promise<void>;
export declare const getAllNotifications: (req: Request, res: Response) => Promise<void>;
export declare const getNotificationById: (req: Request, res: Response) => Promise<void>;
export declare const updateNotification: (req: Request, res: Response) => Promise<void>;
export declare const deleteNotification: (req: Request, res: Response) => Promise<void>;
