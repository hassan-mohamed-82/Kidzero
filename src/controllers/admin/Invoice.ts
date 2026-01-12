import { Request, Response } from 'express';
import { db } from '../../models/db';
import { invoice } from '../../models/schema';
import { eq } from 'drizzle-orm';
import { SuccessResponse } from '../../utils/response';
import { BadRequest } from '../../Errors/BadRequest';


export const getMyInvoices = async (req: Request, res: Response) => {
    const organizationId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest("Invalid organization id");
    }
    const invoices = await db.select().from(invoice).where(eq(invoice.organizationId, organizationId));
    SuccessResponse(res, { message: "Invoices fetched successfully", invoices }, 200);
};