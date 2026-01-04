import { AppError } from "./appError";
export declare class ForeignKeyConstrainError extends AppError {
    constructor(field: string, details?: any);
}
