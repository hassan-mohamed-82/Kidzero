import { AppError } from "./appError";
export declare class DatabaseError extends AppError {
    constructor(message?: string, details?: any);
}
