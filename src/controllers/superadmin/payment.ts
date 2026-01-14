import { Request, Response } from "express";
import { payment, plans, subscriptions, organizations, feeInstallments } from "../../models/schema";
import { db } from "../../models/db";
import { eq, desc, and } from "drizzle-orm";
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
// export const ReplyToPayment = async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const { status, rejectedReason } = req.body;

//     if (!id) {
//         throw new BadRequest("Payment ID is required");
//     }
//     if (!status || !["completed", "rejected"].includes(status)) {
//         throw new BadRequest("Valid status is required");
//     }
//     if (status === "rejected" && !rejectedReason) {
//         throw new BadRequest("Rejection reason is required for rejected payments");
//     }

//     const paymentRecord = await db.query.payment.findFirst({
//         where: eq(payment.id, id),
//     });

//     if (!paymentRecord) {
//         throw new BadRequest("Payment not found");
//     }

//     // Prevent double-processing
//     if (paymentRecord.status !== "pending") {
//         throw new BadRequest("Payment has already been processed");
//     }

//     // Update payment status first
//     await db.update(payment)
//         .set({
//             status,
//             rejectedReason: status === "rejected" ? rejectedReason : null,
//         })
//         .where(eq(payment.id, id));

//     // Create/Renew Subscription for the Organization if accepted
//     if (status === "completed") {
//         const existingSubscription = await db.query.subscriptions.findFirst({
//             where: eq(subscriptions.organizationId, paymentRecord.organizationId),
//         });

//         const startDate = new Date();
//         const endDate = new Date();

//         if (paymentRecord.RequestedSubscriptionType === "yearly") {
//             endDate.setFullYear(endDate.getFullYear() + 1);
//         } else {
//             endDate.setMonth(endDate.getMonth() + 4);
//         }

//         if (existingSubscription) {
//             // Renew Subscription
//             await db.update(subscriptions)
//                 .set({
//                     startDate,
//                     endDate,
//                     planId: paymentRecord.planId,
//                     subscriptionType: paymentRecord.RequestedSubscriptionType,
//                     paymentId: paymentRecord.id,
//                     isActive: true,
//                 })
//                 .where(eq(subscriptions.id, existingSubscription.id));

//             return SuccessResponse(res, { message: "Subscription renewed successfully" });
//         } else {
//             // Create new Subscription
//             await db.insert(subscriptions).values({
//                 organizationId: paymentRecord.organizationId,
//                 planId: paymentRecord.planId,
//                 startDate,
//                 endDate,
//                 subscriptionType: paymentRecord.RequestedSubscriptionType,
//                 paymentId: paymentRecord.id,
//                 isActive: true,
//             });

//             // Update Organization Status
//             await db.update(organizations)
//                 .set({
//                     status: "subscribed",
//                 })
//                 .where(eq(organizations.id, paymentRecord.organizationId));

//             return SuccessResponse(res, { message: "Subscription created successfully" });
//         }
//     }

//     // If rejected, just return
//     return SuccessResponse(res, { message: "Payment rejected successfully" });
// };

export const ReplyToPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Payment ID is required");
    }
    const { status, rejectedReason } = req.body;
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

    // Create Subscription for the organization if accepted
    if (status === "completed") {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // Assuming yearly subscription for simplicity
    }      
};

// =====================================================
// FEE INSTALLMENT MANAGEMENT (Super Admin)
// =====================================================

/**
 * Get all fee installments (with optional status filter)
 */
export const getAllInstallments = async (req: Request, res: Response) => {
    const { status } = req.query;

    let allInstallments;

    if (status && ["pending", "approved", "rejected", "overdue"].includes(status as string)) {
        allInstallments = await db
            .select()
            .from(feeInstallments)
            .where(eq(feeInstallments.status, status as "pending" | "approved" | "rejected" | "overdue"))
            .orderBy(desc(feeInstallments.createdAt));
    } else {
        allInstallments = await db
            .select()
            .from(feeInstallments)
            .orderBy(desc(feeInstallments.createdAt));
    }

    // Group by status for summary
    const pendingCount = allInstallments.filter(i => i.status === "pending").length;
    const approvedCount = allInstallments.filter(i => i.status === "approved").length;
    const rejectedCount = allInstallments.filter(i => i.status === "rejected").length;
    const overdueCount = allInstallments.filter(i => i.status === "overdue").length;

    return SuccessResponse(res, {
        message: "Installments retrieved successfully",
        installments: allInstallments,
        summary: {
            total: allInstallments.length,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            overdue: overdueCount,
        }
    });
};

/**
 * Get a specific installment by ID
 */
export const getInstallmentById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new BadRequest("Installment ID is required");
    }

    const installment = await db.query.feeInstallments.findFirst({
        where: eq(feeInstallments.id, id),
    });

    if (!installment) {
        throw new BadRequest("Installment not found");
    }

    // Get organization and subscription details
    const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, installment.subscriptionId),
    });

    const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, installment.organizationId),
    });

    const plan = subscription ? await db.query.plans.findFirst({
        where: eq(plans.id, subscription.planId),
    }) : null;

    return SuccessResponse(res, {
        message: "Installment retrieved successfully",
        installment,
        organization: organization ? { id: organization.id, name: organization.name } : null,
        plan: plan ? { id: plan.id, name: plan.name, subscriptionFees: plan.subscriptionFees } : null,
    });
};

/**
 * Approve an installment payment
 */
export const approveInstallment = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new BadRequest("Installment ID is required");
    }

    const installment = await db.query.feeInstallments.findFirst({
        where: eq(feeInstallments.id, id),
    });

    if (!installment) {
        throw new BadRequest("Installment not found");
    }

    if (installment.status !== "pending") {
        throw new BadRequest(`Installment has already been ${installment.status}`);
    }

    // Calculate new totals
    const newPaidAmount = installment.paidAmount + installment.installmentAmount;
    const newRemainingAmount = installment.totalFeeAmount - newPaidAmount;

    // Update this installment to approved
    await db.update(feeInstallments)
        .set({
            status: "approved",
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
        })
        .where(eq(feeInstallments.id, id));

    // Check if fully paid
    const isFullyPaid = newRemainingAmount <= 0;

    return SuccessResponse(res, {
        message: "Installment approved successfully",
        data: {
            installmentId: id,
            amountPaid: installment.installmentAmount,
            totalPaidNow: newPaidAmount,
            remainingAmount: newRemainingAmount,
            isFullyPaid,
        }
    });
};

/**
 * Reject an installment payment
 */
export const rejectInstallment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rejectedReason } = req.body;

    if (!id) {
        throw new BadRequest("Installment ID is required");
    }

    if (!rejectedReason) {
        throw new BadRequest("Rejection reason is required");
    }

    const installment = await db.query.feeInstallments.findFirst({
        where: eq(feeInstallments.id, id),
    });

    if (!installment) {
        throw new BadRequest("Installment not found");
    }

    if (installment.status !== "pending") {
        throw new BadRequest(`Installment has already been ${installment.status}`);
    }

    // Update installment to rejected
    await db.update(feeInstallments)
        .set({
            status: "rejected",
            rejectedReason,
        })
        .where(eq(feeInstallments.id, id));

    return SuccessResponse(res, {
        message: "Installment rejected successfully",
        data: {
            installmentId: id,
            rejectedReason,
        }
    });
};


// Parents

export const ReplyToPaymentParent = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Payment ID is required");
    }
    const { status, rejectedReason } = req.body;
    if (!status || !["completed", "rejected"].includes(status)) {
        throw new BadRequest("Valid status is required");
    }
    if (status === "rejected" && !rejectedReason) {
        throw new BadRequest("Rejection reason is required for rejected payments");
    }