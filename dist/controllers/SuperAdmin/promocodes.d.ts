import { Request, Response } from "express";
export declare const createPromoCode: (req: Request, res: Response) => Promise<void>;
export declare const getAllPromoCodes: (req: Request, res: Response) => Promise<void>;
export declare const getPromocodeById: (req: Request, res: Response) => Promise<void>;
export declare const deletePromoCodeById: (req: Request, res: Response) => Promise<void>;
export declare const updatePromoCodeById: (req: Request, res: Response) => Promise<void>;
