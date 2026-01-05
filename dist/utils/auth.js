// src/utils/auth.ts
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../Errors";
import "dotenv/config";
const JWT_SECRET = process.env.JWT_SECRET;
// للـ SuperAdmin (أنت - البائع)
export const generateSuperAdminToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "superadmin",
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
// للـ Organizer (صاحب المؤسسة)
export const generateOrganizerToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "organizer",
        organizationId: data.organizationId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
// للـ Admin (موظف بصلاحيات)
export const generateAdminToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "admin",
        organizationId: data.organizationId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
// للـ Driver (Mobile App)
export const generateDriverToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "driver",
        organizationId: data.organizationId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
// للـ CoDriver (Mobile App)
export const generateCoDriverToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        role: "codriver",
        organizationId: data.organizationId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
// Verify Token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new UnauthorizedError("Invalid token");
    }
};
//# sourceMappingURL=auth.js.map