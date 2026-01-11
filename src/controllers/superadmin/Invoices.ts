import { Request , Response } from 'express';
import { invoice } from '../../models/schema';
import { db } from '../../models/db';
import { eq } from 'drizzle-orm';
import { BadRequest } from '../../Errors/BadRequest';
import { SuccessResponse } from '../../utils/response';

export const getAllInvoices = async (req: Request, res: Response) => {
    const invoices = await db.query.invoice.findMany();
    return SuccessResponse(res, { message: "Invoices retrieved successfully", data: invoices }, 200);
};

export const getInvoiceById = async (req: Request, res: Response) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Invoice Id");
    }
    const invoiceRecord = await db.query.invoice.findFirst({
        where: eq(invoice.id, Id)
    });
    if (!invoiceRecord) {
        throw new BadRequest("Invoice not found");
    }
    return SuccessResponse(res, { message: "Invoice retrieved successfully", data: invoiceRecord }, 200);
};

export const deleteInvoice = async (req: Request, res: Response) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Invoice Id");
    }
    const existingInvoice = await db.query.invoice.findFirst({
        where: eq(invoice.id, Id)
    });
    if (!existingInvoice) {
        throw new BadRequest("Invoice not found");
    }
    await db.delete(invoice).where(eq(invoice.id, Id));
    return SuccessResponse(res, { message: "Invoice deleted successfully" }, 200);
};