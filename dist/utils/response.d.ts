import { Response } from "express";
export interface IErrorResponse {
    success: false;
    error: {
        code: number;
        message: string;
        details?: any;
    };
}
export declare const SuccessResponse: <T>(res: Response, data: T, statusCode?: number) => void;
