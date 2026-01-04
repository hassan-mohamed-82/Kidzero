import { AppError } from "./appError";
import { StatusCodes } from "http-status-codes";
export class UniqueConstrainError extends AppError {
    constructor(field, details) {
        super(`Field ${field} must be unique`, StatusCodes.CONFLICT, details);
    }
}
//# sourceMappingURL=uniqueConstrainError.js.map