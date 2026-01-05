import { Request, Response } from "express";
export declare const getAllBusTypes: (req: Request, res: Response) => Promise<void>;
export declare const getBusTypeById: (req: Request, res: Response) => Promise<void>;
export declare const createBusType: (req: Request, res: Response) => Promise<void>;
export declare const updateBusType: (req: Request, res: Response) => Promise<void>;
export declare const deleteBusType: (req: Request, res: Response) => Promise<void>;
