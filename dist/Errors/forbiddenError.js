import { AppError } from "./appError";
import { StatusCodes } from "http-status-codes";
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden Resource", details) {
        super(message, StatusCodes.FORBIDDEN, details);
    }
}
//# sourceMappingURL=forbiddenError.js.map