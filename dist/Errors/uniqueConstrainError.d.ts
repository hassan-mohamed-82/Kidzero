import { AppError } from "./appError";
export declare class UniqueConstrainError extends AppError {
    constructor(field: string, details?: any);
}
