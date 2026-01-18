"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyInvoices = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const getMyInvoices = async (req, res) => {
    const organizationId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Invalid organization id");
    }
    const invoices = await db_1.db.select().from(schema_1.invoice).where((0, drizzle_orm_1.eq)(schema_1.invoice.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { message: "Invoices fetched successfully", invoices }, 200);
};
exports.getMyInvoices = getMyInvoices;
