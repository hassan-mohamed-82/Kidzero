import { Request, Response } from "express";
export declare const getAllBuses: (req: Request, res: Response) => Promise<void>;
export declare const getBusById: (req: Request, res: Response) => Promise<void>;
export declare const createBus: (req: Request, res: Response) => Promise<void>;
export declare const updateBus: (req: Request, res: Response) => Promise<void>;
export declare const deleteBus: (req: Request, res: Response) => Promise<void>;
export declare const updateBusStatus: (req: Request, res: Response) => Promise<void>;
export declare const getBusesByStatus: (req: Request, res: Response) => Promise<void>;
