import { Request, Response } from "express";
export declare const createBanner: (req: Request, res: Response) => Promise<void>;
export declare const getAllBanners: (req: Request, res: Response) => Promise<void>;
export declare const deleteBanner: (req: Request, res: Response) => Promise<void>;
export declare const getBanner: (req: Request, res: Response) => Promise<void>;
export declare const updateBanner: (req: Request, res: Response) => Promise<void>;
