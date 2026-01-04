// src/utils/auth.ts
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../Errors";
import "dotenv/config";
const JWT_SECRET = process.env.JWT_SECRET;
export const generateSuperAdminToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "superadmin",
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
export const generateOrganizationToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "organization",
        organizationId: data.id,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
export const generateParentToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "parent",
        organizationId: data.organizationId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
export const generateDriverToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "driver",
        organizationId: data.organizationId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
export const generateCoDriverToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "codriver",
        organizationId: data.organizationId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new UnauthorizedError("Invalid token");
    }
};
//# sourceMappingURL=auth.js.map