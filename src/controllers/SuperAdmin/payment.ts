import { Request , Response } from "express";
import { payment } from "../../models/schema";
import { db } from "../../models/db";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";


export const getAllPayments = async (req: Request, res: Response) => {
    const payments = await db.query.payment.findMany();
    return SuccessResponse(res, {message: "Payments retrieved successfully", payments });
};  

export const getPaymentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Payment ID is required");
    }
    const paymentRecord = await db.query.payment.findFirst({
        where: eq(payment.id, id),
    });

    if (!paymentRecord) {
        throw new BadRequest("Payment not found");
    }
    return SuccessResponse(res, { message: "Payment retrieved successfully", payment: paymentRecord });
};

// Accept or Reject Payment
export const ReplyToPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;
    if (!id) {
        throw new BadRequest("Payment ID is required");
    }
    if (!status || !["completed", "rejected"].includes(status)) {
        throw new BadRequest("Valid status is required");
    }
    if (status === "rejected" && !rejectedReason) {
        throw new BadRequest("Rejection reason is required for rejected payments");
    }
    const paymentRecord = await db.query.payment.findFirst({
        where: eq(payment.id, id),
    });
    if (!paymentRecord) {
        throw new BadRequest("Payment not found");
    }

    const updatedPayment = await db.update(payment)
        .set({
            status,
            rejectedReason: status === "rejected" ? rejectedReason : null,
        })
        .where(eq(payment.id, id));

    return SuccessResponse(res, { message: "Payment updated successfully", payment: updatedPayment[0] });
};
