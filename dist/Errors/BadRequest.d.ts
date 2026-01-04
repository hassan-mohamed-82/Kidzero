import { AppError } from "./appError";
export declare class BadRequest extends AppError {
    constructor(message?: string, details?: any);
}
