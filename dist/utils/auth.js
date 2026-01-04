import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UnauthorizedError } from "../Errors";
dotenv.config();
export const generateToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
        };
    }
    catch (error) {
        throw new UnauthorizedError("Invalid token");
    }
};
//# sourceMappingURL=auth.js.map