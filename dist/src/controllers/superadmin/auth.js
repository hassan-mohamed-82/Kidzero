"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const db_1 = require("../../models/db");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../../utils/auth");
const superadmin_1 = require("../../models/superadmin/superadmin");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function login(req, res) {
    const data = req.body;
    const SuperAdmin = await db_1.db.query.superAdmins.findFirst({
        where: (0, drizzle_orm_1.eq)(superadmin_1.superAdmins.email, data.email),
    });
    if (!SuperAdmin) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const match = await bcrypt_1.default.compare(data.password, SuperAdmin.passwordHashed);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const token = (0, auth_1.generateSuperAdminToken)({
        id: SuperAdmin.id,
        email: SuperAdmin.email,
        name: SuperAdmin.name,
    });
    (0, response_1.SuccessResponse)(res, { message: "login Successful", token: token,
        superAdmin: {
            id: SuperAdmin.id,
            name: SuperAdmin.name,
            email: SuperAdmin.email,
            role: "superadmin",
        }
    }, 200);
}
