import { Response, Request, RequestHandler, NextFunction } from "express";
export declare function catchAsync(fn: RequestHandler): (req: Request, res: Response, next: NextFunction) => void;
