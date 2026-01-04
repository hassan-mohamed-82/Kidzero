import { AppError } from "./appError";
export declare class ForbiddenError extends AppError {
    constructor(message?: string, details?: any);
}
