// // src/controllers/admin/paymentController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { payment, plans, paymentMethod, organizations, promocode, feeInstallments, subscriptions } from "../../models/schema";
import { eq, and, desc } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { saveBase64Image } from "../../utils/handleImages";


export const getAllPayments = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allPayments = await db
        .select({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            receiptImage: payment.receiptImage,
            rejectedReason: payment.rejectedReason,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            plan: {
                id: plans.id,
                name: plans.name,
                price: plans.price
            },
            paymentMethod: {
                id: paymentMethod.id,
                name: paymentMethod.name,
            },
        })
        .from(payment)
        .leftJoin(plans, eq(payment.planId, plans.id))
        .leftJoin(paymentMethod, eq(payment.paymentMethodId, paymentMethod.id))
        .where(eq(payment.organizationId, organizationId))
        .orderBy(desc(payment.createdAt));

    // Group payments by status for summary
    const summary = {
        total: allPayments.length,
        pending: allPayments.filter((p) => p.status === "pending").length,
        completed: allPayments.filter((p) => p.status === "completed").length,
        rejected: allPayments.filter((p) => p.status === "rejected").length,
    };

    return SuccessResponse(res, { message: "Payments fetched successfully", payments: allPayments, summary }, 200);
};


export const getPaymentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!id) {
        throw new BadRequest("Payment ID is required");
    }
    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const paymentResult = await db
        .select({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            receiptImage: payment.receiptImage,
            rejectedReason: payment.rejectedReason,
            promocodeId: payment.promocodeId,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            plan: {
                id: plans.id,
                name: plans.name,
                price: plans.price,
                maxBuses: plans.maxBuses,
                maxDrivers: plans.maxDrivers,
                maxStudents: plans.maxStudents,
            },
            paymentMethod: {
                id: paymentMethod.id,
                name: paymentMethod.name,
                feeStatus: paymentMethod.feeStatus,
                feeAmount: paymentMethod.feeAmount,
            },
        })
        .from(payment)
        .leftJoin(plans, eq(payment.planId, plans.id))
        .leftJoin(paymentMethod, eq(payment.paymentMethodId, paymentMethod.id))
        .where(and(eq(payment.id, id), eq(payment.organizationId, organizationId)))
        .limit(1);

    if (!paymentResult[0]) {
        throw new NotFound("Payment not found");
    }

    SuccessResponse(res, { message: "Payment fetched successfully", payment: paymentResult[0] }, 200);
};

export const createPayment = async (req: Request, res: Response) => {
    const { planId, paymentMethodId, amount, receiptImage, promocodeId, nextDueDate } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    if (!planId || !paymentMethodId || !amount) {
        throw new BadRequest("planId, paymentMethodId, and amount are required");
    }

    // Validate plan exists
    const planResult = await db
        .select()
        .from(plans)
        .where(eq(plans.id, planId))
        .limit(1);

    if (!planResult[0]) {
        throw new NotFound("Plan not found");
    }

    const plan = planResult[0];

    // Validate payment method exists and is active
    const payMethodResult = await db
        .select()
        .from(paymentMethod)
        .where(
            and(eq(paymentMethod.id, paymentMethodId), eq(paymentMethod.isActive, true))
        )
        .limit(1);

    if (!payMethodResult[0]) {
        throw new NotFound("Payment method not found or inactive");
    }

    // Save receipt image if provided
    let receiptImageUrl: string | null = null;
    if (receiptImage) {
        const savedImage = await saveBase64Image(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }

    // Generate new payment ID
    const newPaymentId = crypto.randomUUID();
    // Calculate total amount with fee if applicable
    let totalAmount = amount;
    if (payMethodResult[0].feeStatus === true) {
        if (payMethodResult[0].feeAmount > 0) {
            totalAmount = amount + payMethodResult[0].feeAmount;
        } else {
            throw new BadRequest("Invalid fee amount in payment method");
        }
    }
    // Apply promocode if provided
    if (promocodeId) {
        const promoResult = await db
            .select()
            .from(promocode)
            .where(and(eq(promocode.id, promocodeId)))
            .limit(1);
        if (!promoResult[0]) {
            throw new NotFound("Promocode not found");
        }
        if (promoResult[0].isActive === false) {
            throw new BadRequest("Promocode is not active");
        }
        totalAmount = totalAmount - promoResult[0].amount;
        if (totalAmount < 0) {
            totalAmount = 0;
        }
    }

    // Check if payment is less than subscription fees - route to installment path
    const subscriptionFees = plan.subscriptionFees;
    const minPayment = plan.minSubscriptionFeesPay;
    const isPartialPayment = totalAmount < subscriptionFees;

    if (isPartialPayment) {
        // Validate minimum payment requirement
        if (totalAmount < minPayment) {
            throw new BadRequest(
                `Payment amount (${totalAmount}) is less than the minimum required payment (${minPayment}). ` +
                `You must pay at least ${minPayment} to start a subscription with installments.`
            );
        }

        // For partial payments, nextDueDate is required
        if (!nextDueDate) {
            throw new BadRequest(
                "Next payment due date is required for partial/installment payments. " +
                `You are paying ${totalAmount} out of ${subscriptionFees} total fees.`
            );
        }

        // Validate due date is in the future
        const dueDate = new Date(nextDueDate);
        if (dueDate <= new Date()) {
            throw new BadRequest("Next due date must be in the future");
        }

        // Insert payment record first
        await db.insert(payment).values({
            id: newPaymentId,
            organizationId,
            planId,
            paymentMethodId,
            amount: totalAmount,
            receiptImage: receiptImageUrl || "",
            promocodeId: promocodeId || null,
            status: "pending",
        });

        // Check for existing active subscription or create new one
        let activeSubscription = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.organizationId, organizationId),
                eq(subscriptions.isActive, true)
            ),
        });

        // If no active subscription, we need to create one after payment is approved
        // For now, create subscription with pending status linked to this payment
        let subscriptionId: string;
        if (!activeSubscription) {
            subscriptionId = crypto.randomUUID();
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

            await db.insert(subscriptions).values({
                id: subscriptionId,
                planId,
                organizationId,
                startDate,
                endDate,
                paymentId: newPaymentId,
                isActive: false, // Will be activated when payment is approved
            });
        } else {
            subscriptionId = activeSubscription.id;
        }

        // Create fee installment record
        const newInstallmentId = crypto.randomUUID();
        await db.insert(feeInstallments).values({
            id: newInstallmentId,
            subscriptionId,
            organizationId,
            paymentMethodId,
            totalFeeAmount: subscriptionFees,
            paidAmount: 0, // Will be updated when approved
            remainingAmount: subscriptionFees - totalAmount, // Will be this after approval
            installmentAmount: totalAmount,
            dueDate: new Date(nextDueDate),
            status: "pending",
            receiptImage: receiptImageUrl || undefined,
            installmentNumber: 1,
        });

        // Fetch created payment with details
        const createdPayment = await db
            .select({
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                receiptImage: payment.receiptImage,
                createdAt: payment.createdAt,
                plan: {
                    id: plans.id,
                    name: plans.name,
                },
                paymentMethod: {
                    id: paymentMethod.id,
                    name: paymentMethod.name,
                },
                promocode: {
                    id: promocode.id,
                    code: promocode.code,
                },
            })
            .from(payment)
            .leftJoin(plans, eq(payment.planId, plans.id))
            .leftJoin(paymentMethod, eq(payment.paymentMethodId, paymentMethod.id))
            .leftJoin(promocode, eq(payment.promocodeId, promocode.id))
            .where(eq(payment.id, newPaymentId))
            .limit(1);

        return SuccessResponse(
            res,
            {
                message: "Installment payment created successfully. Awaiting admin approval.",
                payment: createdPayment[0],
                installmentDetails: {
                    installmentId: newInstallmentId,
                    subscriptionId,
                    totalFeeAmount: subscriptionFees,
                    paidAmount: totalAmount,
                    remainingAmount: subscriptionFees - totalAmount,
                    nextDueDate,
                    isInstallment: true,
                },
            },
            201
        );
    }

    // Full payment path (existing logic)
    // Insert payment
    await db.insert(payment).values({
        id: newPaymentId,
        organizationId,
        planId,
        paymentMethodId,
        amount: totalAmount,
        receiptImage: receiptImageUrl || "",
        promocodeId: promocodeId || null,
        status: "pending",
    });

    // Fetch created payment with details
    const createdPayment = await db
        .select({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            receiptImage: payment.receiptImage,
            createdAt: payment.createdAt,
            plan: {
                id: plans.id,
                name: plans.name,
            },
            paymentMethod: {
                id: paymentMethod.id,
                name: paymentMethod.name,
            },
            promocode: {
                id: promocode.id,
                code: promocode.code,
            },
        })
        .from(payment)
        .leftJoin(plans, eq(payment.planId, plans.id))
        .leftJoin(paymentMethod, eq(payment.paymentMethodId, paymentMethod.id))
        .leftJoin(promocode, eq(payment.promocodeId, promocode.id))
        .where(eq(payment.id, newPaymentId))
        .limit(1);

    SuccessResponse(
        res,
        {
            message: "Payment created successfully",
            payment: createdPayment[0],
        },
        201
    );
};

