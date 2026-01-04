import { AppError } from "./appError";
export declare class NotNullConstrainError extends AppError {
    constructor(field: string, details?: any);
}
