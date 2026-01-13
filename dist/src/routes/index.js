"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = __importDefault(require("./users"));
const superadmin_1 = __importDefault(require("./superadmin"));
const admins_1 = __importDefault(require("./admins"));
const route = (0, express_1.Router)();
route.use("/superadmin", superadmin_1.default);
route.use("/users", users_1.default);
route.use("/admin", admins_1.default);
exports.default = route;
