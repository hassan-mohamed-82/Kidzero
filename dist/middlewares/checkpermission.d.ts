import { Request, Response, NextFunction } from "express";
import { ActionName, ModuleName } from "../types/constant";
export declare const checkPermission: (module: ModuleName, action: ActionName) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
