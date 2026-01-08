"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import usersRoute from "./users";
const superadmin_1 = __importDefault(require("./superadmin"));
const admins_1 = __importDefault(require("./admins"));
const route = (0, express_1.Router)();
route.use("/superadmin", superadmin_1.default);
// route.use("/users", usersRoute);
route.use("/admin", admins_1.default);
exports.default = route;
