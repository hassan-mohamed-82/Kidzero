"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.getInvoiceById = exports.getAllInvoices = void 0;
const schema_1 = require("../../models/schema");
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const response_1 = require("../../utils/response");
const getAllInvoices = async (req, res) => {
    const invoices = await db_1.db.query.invoice.findMany();
    return (0, response_1.SuccessResponse)(res, { message: "Invoices retrieved successfully", data: invoices }, 200);
};
exports.getAllInvoices = getAllInvoices;
const getInvoiceById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Invoice Id");
    }
    const invoiceRecord = await db_1.db.query.invoice.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.invoice.id, Id)
    });
    if (!invoiceRecord) {
        throw new BadRequest_1.BadRequest("Invoice not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Invoice retrieved successfully", data: invoiceRecord }, 200);
};
exports.getInvoiceById = getInvoiceById;
const deleteInvoice = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Invoice Id");
    }
    const existingInvoice = await db_1.db.query.invoice.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.invoice.id, Id)
    });
    if (!existingInvoice) {
        throw new BadRequest_1.BadRequest("Invoice not found");
    }
    await db_1.db.delete(schema_1.invoice).where((0, drizzle_orm_1.eq)(schema_1.invoice.id, Id));
    return (0, response_1.SuccessResponse)(res, { message: "Invoice deleted successfully" }, 200);
};
exports.deleteInvoice = deleteInvoice;
