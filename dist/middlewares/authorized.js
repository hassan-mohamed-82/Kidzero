// src/middlewares/authorizeRoles.ts
import { UnauthorizedError } from "../Errors";
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError("Not authenticated");
        }
        if (!roles.includes(req.user.role)) {
            throw new UnauthorizedError("You don't have permission to access this resource");
        }
        next();
    };
};
//# sourceMappingURL=authorized.js.map