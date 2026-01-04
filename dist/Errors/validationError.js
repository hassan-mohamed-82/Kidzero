import { AppError } from "./appError";
import { StatusCodes } from "http-status-codes";
export class ValidationError extends AppError {
    constructor(message, details) {
        super(message, StatusCodes.BAD_REQUEST, details);
    }
}
//# sourceMappingURL=validationError.js.map