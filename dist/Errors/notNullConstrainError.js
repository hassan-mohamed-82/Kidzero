import { AppError } from "./appError";
import { StatusCodes } from "http-status-codes";
export class NotNullConstrainError extends AppError {
    constructor(field, details) {
        super(`Field ${field} is required`, StatusCodes.BAD_REQUEST, details);
    }
}
//# sourceMappingURL=notNullConstrainError.js.map