import { Request, Response } from "express";
import { payment, plans, subscriptions, organizations } from "../../models/schema";
import { db } from "../../models/db";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";


export const getAllPayments = async (req: Request, res: Response) => {
    const payments = await db.query.payment.findMany();
    return SuccessResponse(res, { message: "Payments retrieved successfully", payments });
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

    // Prevent double-processing
    if (paymentRecord.status !== "pending") {
        throw new BadRequest("Payment has already been processed");
    }

    // Update payment status first
    await db.update(payment)
        .set({
            status,
            rejectedReason: status === "rejected" ? rejectedReason : null,
        })
        .where(eq(payment.id, id));

    // Create/Renew Subscription for the Organization if accepted
    if (status === "completed") {
        const existingSubscription = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.organizationId, paymentRecord.organizationId),
        });

        const startDate = new Date();
        const endDate = new Date();

        if (paymentRecord.RequestedSubscriptionType === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 4);
        }

        if (existingSubscription) {
            // Renew Subscription
            await db.update(subscriptions)
                .set({
                    startDate,
                    endDate,
                    planId: paymentRecord.planId,
                    subscriptionType: paymentRecord.RequestedSubscriptionType,
                    paymentId: paymentRecord.id,
                    isActive: true,
                })
                .where(eq(subscriptions.id, existingSubscription.id));

            return SuccessResponse(res, { message: "Subscription renewed successfully" });
        } else {
            // Create new Subscription
            await db.insert(subscriptions).values({
                organizationId: paymentRecord.organizationId,
                planId: paymentRecord.planId,
                startDate,
                endDate,
                subscriptionType: paymentRecord.RequestedSubscriptionType,
                paymentId: paymentRecord.id,
                isActive: true,
            });

            // Update Organization Status
            await db.update(organizations)
                .set({
                    status: "subscribed",
                })
                .where(eq(organizations.id, paymentRecord.organizationId));

            return SuccessResponse(res, { message: "Subscription created successfully" });
        }
    }

    // If rejected, just return
    return SuccessResponse(res, { message: "Payment rejected successfully" });
};
