"use strict";
// src/utils/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateParentToken = exports.generateCoDriverToken = exports.generateDriverToken = exports.generateAdminToken = exports.generateOrganizerToken = exports.generateSuperAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Errors_1 = require("../Errors");
require("dotenv/config");
const JWT_SECRET = process.env.JWT_SECRET;
// للـ SuperAdmin (أنت - البائع)
const generateSuperAdminToken = (data) => {
    const payload = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: "superadmin",
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateSuperAdminToken = generateSuperAdminToken;
// للـ Organizer (صاحب المؤسسة)
const generateOrganizerToken = (data) => {
    const payload = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: "organizer",
        organizationId: data.organizationId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateOrganizerToken = generateOrganizerToken;
// للـ Admin (موظف بصلاحيات)
const generateAdminToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: "admin",
        organizationId: data.organizationId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateAdminToken = generateAdminToken;
// للـ Driver (Mobile App)
const generateDriverToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: "driver",
        organizationId: data.organizationId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateDriverToken = generateDriverToken;
// للـ CoDriver (Mobile App)
const generateCoDriverToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: "codriver",
        organizationId: data.organizationId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateCoDriverToken = generateCoDriverToken;
// للـ Parent (Mobile App)
const generateParentToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "parent",
        organizationId: data.organizationId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateParentToken = generateParentToken;
// Verify Token
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Errors_1.UnauthorizedError("Invalid token");
    }
};
exports.verifyToken = verifyToken;
