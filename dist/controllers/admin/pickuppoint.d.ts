import { Request, Response } from "express";
export declare const getAllPickupPoints: (req: Request, res: Response) => Promise<void>;
export declare const getPickupPointById: (req: Request, res: Response) => Promise<void>;
export declare const createPickupPoint: (req: Request, res: Response) => Promise<void>;
export declare const updatePickupPoint: (req: Request, res: Response) => Promise<void>;
export declare const deletePickupPoint: (req: Request, res: Response) => Promise<void>;
export declare const togglePickupPointStatus: (req: Request, res: Response) => Promise<void>;
