import { UnauthorizedError } from "../Errors";
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new UnauthorizedError();
        }
        next();
    };
};
//# sourceMappingURL=authorized.js.map