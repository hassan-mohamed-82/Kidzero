import { Request, Response } from "express";
export declare const getAllPlans: (req: Request, res: Response) => Promise<void>;
export declare const getPlanbyId: (req: Request, res: Response) => Promise<void>;
export declare const deletePlanById: (req: Request, res: Response) => Promise<void>;
export declare const createPlan: (req: Request, res: Response) => Promise<void>;
export declare const updatePlan: (req: Request, res: Response) => Promise<void>;
