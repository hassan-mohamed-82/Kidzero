import { AppError } from "./appError";
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, details?: any);
}
