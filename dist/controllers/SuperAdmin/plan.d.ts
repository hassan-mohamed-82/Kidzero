import { Request, Response } from "express";
export declare const getAllPlans: (req: Request, res: Response) => Promise<void>;
export declare const getPlanbyId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
