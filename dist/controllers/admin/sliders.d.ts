import { Request, Response } from "express";
export declare const createSlider: (req: Request, res: Response) => Promise<void>;
export declare const getAllSlidersForAdmin: (req: Request, res: Response) => Promise<void>;
export declare const getSliderById: (req: Request, res: Response) => Promise<void>;
export declare const updateSlider: (req: Request, res: Response) => Promise<void>;
export declare const deleteSlider: (req: Request, res: Response) => Promise<void>;
export declare const changeSliderStatus: (req: Request, res: Response) => Promise<void>;
