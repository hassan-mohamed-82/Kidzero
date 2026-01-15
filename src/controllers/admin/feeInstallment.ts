// src/controllers/admin/feeInstallment.ts
// Controller for organizations to manage their subscription fee installments

import { Request, Response } from "express";
import { db } from "../../models/db";
import { feeInstallments, plans, subscriptions, paymentMethod } from "../../models/schema";
import { eq, and, desc } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { saveBase64Image } from "../../utils/handleImages";

/**
 * Get current installment status and payment summary for the organization
 */
export const getInstallmentStatus = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    // Get active subscription
    const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.organizationId, organizationId),
            eq(subscriptions.isActive, true)
        ),
    });

    if (!activeSubscription) {
        throw new NotFound("No active subscription found");
    }

    // Get plan details for subscription fees
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, activeSubscription.planId),
    });

    if (!plan) {
        throw new NotFound("Plan not found");
    }

    // Get all installments for this subscription
    const allInstallments = await db
        .select()
        .from(feeInstallments)
        .where(eq(feeInstallments.subscriptionId, activeSubscription.id))
        .orderBy(desc(feeInstallments.createdAt));

    // Calculate totals from approved installments
    const approvedInstallments = allInstallments.filter(i => i.status === "approved");
    const totalPaid = approvedInstallments.reduce((sum, i) => sum + i.installmentAmount, 0);
    const remainingAmount = plan.subscriptionFees - totalPaid;

    // Check for pending installments
    const pendingInstallment = allInstallments.find(i => i.status === "pending");
    const overdueInstallments = allInstallments.filter(i => i.status === "overdue");

    return SuccessResponse(res, {
        message: "Installment status fetched successfully",
        data: {
            subscription: {
                id: activeSubscription.id,
                planId: activeSubscription.planId,
                planName: plan.name,
                startDate: activeSubscription.startDate,
                endDate: activeSubscription.endDate,
            },
            feeDetails: {
                totalFeeAmount: plan.subscriptionFees,
                minPaymentRequired: plan.minSubscriptionFeesPay,
                totalPaid,
                remainingAmount,
                isFullyPaid: remainingAmount <= 0,
            },
            pendingInstallment: pendingInstallment || null,
            hasOverdueInstallments: overdueInstallments.length > 0,
            overdueCount: overdueInstallments.length,
            installmentHistory: allInstallments,
        }
    }, 200);
};

/**
 * Get all installment history for the organization
 */
export const getInstallmentHistory = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const allInstallments = await db
        .select()
        .from(feeInstallments)
        .where(eq(feeInstallments.organizationId, organizationId))
        .orderBy(desc(feeInstallments.createdAt));

    // Group by status for summary
    const summary = {
        total: allInstallments.length,
        pending: allInstallments.filter(i => i.status === "pending").length,
        approved: allInstallments.filter(i => i.status === "approved").length,
        rejected: allInstallments.filter(i => i.status === "rejected").length,
        overdue: allInstallments.filter(i => i.status === "overdue").length,
    };

    return SuccessResponse(res, {
        message: "Installment history fetched successfully",
        installments: allInstallments,
        summary,
    }, 200);
};

/**
 * Create a new installment payment
 * Organization pays either full remaining amount or partial (with next due date)
 */
export const createInstallmentPayment = async (req: Request, res: Response) => {
    const { amount, receiptImage, nextDueDate, paymentMethodId } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    if (!amount || amount <= 0) {
        throw new BadRequest("Valid payment amount is required");
    }

    if (!paymentMethodId) {
        throw new BadRequest("Payment method ID is required");
    }

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

    // Get active subscription
    const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.organizationId, organizationId),
            eq(subscriptions.isActive, true)
        ),
    });

    if (!activeSubscription) {
        throw new NotFound("No active subscription found. Please subscribe to a plan first.");
    }

    // Check if there's already a pending installment
    const pendingInstallment = await db.query.feeInstallments.findFirst({
        where: and(
            eq(feeInstallments.subscriptionId, activeSubscription.id),
            eq(feeInstallments.status, "pending")
        ),
    });

    if (pendingInstallment) {
        throw new BadRequest("You already have a pending installment awaiting approval. Please wait for admin review.");
    }

    // Get plan details
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, activeSubscription.planId),
    });

    if (!plan) {
        throw new NotFound("Plan not found");
    }

    // Calculate current payment status
    const approvedInstallments = await db
        .select()
        .from(feeInstallments)
        .where(and(
            eq(feeInstallments.subscriptionId, activeSubscription.id),
            eq(feeInstallments.status, "approved")
        ));

    const totalPaid = approvedInstallments.reduce((sum, i) => sum + i.installmentAmount, 0);
    const remainingAmount = plan.subscriptionFees - totalPaid;
    const installmentNumber = approvedInstallments.length + 1;

    // Check if already fully paid
    if (remainingAmount <= 0) {
        throw new BadRequest("Subscription fees are already fully paid");
    }

    // Validate minimum payment for first installment
    if (installmentNumber === 1 && amount < plan.minSubscriptionFeesPay) {
        throw new BadRequest(`First payment must be at least ${plan.minSubscriptionFeesPay} (minimum subscription fee)`);
    }

    // Validate amount doesn't exceed remaining
    if (amount > remainingAmount) {
        throw new BadRequest(`Payment amount (${amount}) exceeds remaining balance (${remainingAmount})`);
    }

    // If paying partial, nextDueDate should be provided
    const isPartialPayment = amount < remainingAmount;
    if (isPartialPayment && !nextDueDate) {
        throw new BadRequest("Next payment due date is required for partial payments");
    }

    // Validate due date is in the future
    if (nextDueDate) {
        const dueDate = new Date(nextDueDate);
        if (dueDate <= new Date()) {
            throw new BadRequest("Next due date must be in the future");
        }
    }

    // Save receipt image if provided
    let receiptImageUrl: string | null = null;
    if (receiptImage) {
        const savedImage = await saveBase64Image(req, receiptImage, "installments/receipts");
        receiptImageUrl = savedImage.url;
    }

    // Create installment record
    const newInstallmentId = crypto.randomUUID();

    await db.insert(feeInstallments).values({
        id: newInstallmentId,
        subscriptionId: activeSubscription.id,
        organizationId,
        paymentMethodId,
        totalFeeAmount: plan.subscriptionFees,
        paidAmount: totalPaid,
        remainingAmount: remainingAmount - amount, // Will be this after approval
        installmentAmount: amount,
        dueDate: nextDueDate ? new Date(nextDueDate) : null,
        status: "pending",
        receiptImage: receiptImageUrl || undefined,
        installmentNumber,
    });

    // Fetch created installment
    const createdInstallment = await db.query.feeInstallments.findFirst({
        where: eq(feeInstallments.id, newInstallmentId),
    });

    return SuccessResponse(res, {
        message: "Installment payment submitted successfully. Awaiting admin approval.",
        installment: createdInstallment,
        summary: {
            totalFeeAmount: plan.subscriptionFees,
            previouslyPaid: totalPaid,
            thisPayment: amount,
            remainingAfterApproval: remainingAmount - amount,
            isFullPayment: !isPartialPayment,
            nextDueDate: nextDueDate || null,
        }
    }, 201);
};

/**
 * Get a specific installment by ID
 */
export const getInstallmentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!id) {
        throw new BadRequest("Installment ID is required");
    }

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const installment = await db.query.feeInstallments.findFirst({
        where: and(
            eq(feeInstallments.id, id),
            eq(feeInstallments.organizationId, organizationId)
        ),
    });

    if (!installment) {
        throw new NotFound("Installment not found");
    }

    return SuccessResponse(res, {
        message: "Installment fetched successfully",
        installment,
    }, 200);
};
