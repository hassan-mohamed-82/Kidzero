"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSubscribers = void 0;
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const getAllSubscribers = async (req, res) => {
    const SubscribedOrganizations = await db_1.db.query.organizations.findMany({ where: (organizations) => (0, drizzle_orm_1.eq)(organizations.status, "subscribed") });
    return (0, response_1.SuccessResponse)(res, { message: "Fetched subscribed organizations successfully", data: SubscribedOrganizations }, 200);
};
exports.getAllSubscribers = getAllSubscribers;
