import { Request, Response, NextFunction } from "express";
import { ModuleName, ActionName } from "../types/constant";
export declare const checkPermission: (module: ModuleName, action?: ActionName) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
