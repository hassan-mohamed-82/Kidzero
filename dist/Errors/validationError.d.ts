import { AppError } from "./appError";
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
