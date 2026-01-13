"use strict";
// src/controllers/mobile/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverAppLogin = exports.parentLogin = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../utils/auth");
// ✅ Parent Login (Parent App)
const parentLogin = async (req, res) => {
    const { phone, password } = req.body;
    const parent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.phone, phone))
        .limit(1);
    if (!parent[0]) {
        throw new Errors_1.UnauthorizedError("Invalid phone number or password");
    }
    if (parent[0].status === "inactive") {
        throw new Errors_1.UnauthorizedError("Your account is inactive. Please contact admin.");
    }
    const isValidPassword = await bcrypt_1.default.compare(password, parent[0].password);
    if (!isValidPassword) {
        throw new Errors_1.UnauthorizedError("Invalid phone number or password");
    }
    // جلب الأبناء
    const children = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parent[0].id));
    const token = (0, auth_1.generateParentToken)({
        id: parent[0].id,
        name: parent[0].name,
        organizationId: parent[0].organizationId,
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Login successful",
        token,
        user: {
            id: parent[0].id,
            name: parent[0].name,
            phone: parent[0].phone,
            avatar: parent[0].avatar,
            address: parent[0].address,
            role: "parent",
            children,
        },
    }, 200);
};
exports.parentLogin = parentLogin;
// ✅ Driver/CoDriver Login (Driver App)
const driverAppLogin = async (req, res) => {
    const { phone, password } = req.body;
    // 1. البحث في جدول الـ Drivers
    const driver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.eq)(schema_1.drivers.phone, phone))
        .limit(1);
    if (driver[0]) {
        if (driver[0].status === "inactive") {
            throw new Errors_1.UnauthorizedError("Your account is inactive. Please contact admin.");
        }
        const isValidPassword = await bcrypt_1.default.compare(password, driver[0].password);
        if (!isValidPassword) {
            throw new Errors_1.UnauthorizedError("Invalid phone number or password");
        }
        const token = (0, auth_1.generateDriverToken)({
            id: driver[0].id,
            name: driver[0].name,
            organizationId: driver[0].organizationId,
        });
        return (0, response_1.SuccessResponse)(res, {
            message: "Login successful",
            token,
            user: {
                id: driver[0].id,
                name: driver[0].name,
                phone: driver[0].phone,
                avatar: driver[0].avatar,
                role: "driver",
            },
        }, 200);
    }
    // 2. البحث في جدول الـ CoDrivers
    const codriver = await db_1.db
        .select()
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.eq)(schema_1.codrivers.phone, phone))
        .limit(1);
    if (codriver[0]) {
        if (codriver[0].status === "inactive") {
            throw new Errors_1.UnauthorizedError("Your account is inactive. Please contact admin.");
        }
        const isValidPassword = await bcrypt_1.default.compare(password, codriver[0].password);
        if (!isValidPassword) {
            throw new Errors_1.UnauthorizedError("Invalid phone number or password");
        }
        const token = (0, auth_1.generateCoDriverToken)({
            id: codriver[0].id,
            name: codriver[0].name,
            organizationId: codriver[0].organizationId,
        });
        return (0, response_1.SuccessResponse)(res, {
            message: "Login successful",
            token,
            user: {
                id: codriver[0].id,
                name: codriver[0].name,
                phone: codriver[0].phone,
                avatar: codriver[0].avatar,
                role: "codriver",
            },
        }, 200);
    }
    throw new Errors_1.UnauthorizedError("Invalid phone number or password");
};
exports.driverAppLogin = driverAppLogin;
