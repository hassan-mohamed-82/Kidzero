import { AppError } from "./appError";
export declare class ConflictError extends AppError {
    constructor(message?: string, details?: any);
}
