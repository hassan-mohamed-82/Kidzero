import { Request, Response } from "express";
import { payment, plans, subscriptions, organizations, feeInstallments, parentPayment, parentSubscriptions, paymentMethod } from "../../models/schema";
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

    // Handle approved payments based on paymentType
    if (status === "completed") {
        const paymentType = paymentRecord.paymentType || "subscription";

        if (paymentType === "renewal") {
            // Renewal: Extend existing subscription's end date by 1 year
            const existingSubscription = await db.query.subscriptions.findFirst({
                where: and(
                    eq(subscriptions.organizationId, paymentRecord.organizationId),
                    eq(subscriptions.isActive, true)
                ),
            });

            if (existingSubscription) {
                // Extend end date by 1 year from current end date
                const newEndDate = new Date(existingSubscription.endDate);
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);

                await db.update(subscriptions)
                    .set({
                        endDate: newEndDate,
                        paymentId: paymentRecord.id,
                    })
                    .where(eq(subscriptions.id, existingSubscription.id));

                return SuccessResponse(res, {
                    message: "Renewal approved. Subscription extended successfully.",
                    subscriptionId: existingSubscription.id,
                    newEndDate,
                }, 200);
            } else {
                // No active subscription found, create new one
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1);

                await db.insert(subscriptions).values({
                    organizationId: paymentRecord.organizationId,
                    planId: paymentRecord.planId,
                    startDate,
                    endDate,
                    paymentId: paymentRecord.id,
                    isActive: true,
                });

                await db.update(organizations)
                    .set({ status: "subscribed" })
                    .where(eq(organizations.id, paymentRecord.organizationId));

                return SuccessResponse(res, {
                    message: "Renewal approved. New subscription created.",
                    endDate,
                }, 200);
            }
        } else if (paymentType === "plan_price") {
            // Plan price payment: Just mark as completed, no subscription changes
            return SuccessResponse(res, {
                message: "Plan price payment approved successfully.",
            }, 200);
        } else {
            // Default: subscription type - create new subscription
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            await db.insert(subscriptions).values({
                organizationId: paymentRecord.organizationId,
                planId: paymentRecord.planId,
                startDate,
                endDate,
                paymentId: paymentRecord.id,
                isActive: true,
            });

            await db.update(organizations)
                .set({ status: "subscribed" })
                .where(eq(organizations.id, paymentRecord.organizationId));

            return SuccessResponse(res, {
                message: "Payment approved. Subscription created successfully.",
                endDate,
            }, 200);
        }
    }

    // Rejected payment
    return SuccessResponse(res, { message: "Payment rejected successfully" }, 200);
};

// =====================================================
// FEE INSTALLMENT MANAGEMENT (Super Admin)
// =====================================================

/**
 * Get all fee installments (with optional status filter)
 */
export const getAllInstallments = async (req: Request, res: Response) => {
    const { status } = req.query;

    let query = db
        .select({

            id: feeInstallments.id,
            subscriptionId: feeInstallments.subscriptionId,
            organizationId: feeInstallments.organizationId,
            paymentMethodId: feeInstallments.paymentMethodId,
            totalFeeAmount: feeInstallments.totalFeeAmount,
            paidAmount: feeInstallments.paidAmount,
            remainingAmount: feeInstallments.remainingAmount,
            installmentAmount: feeInstallments.installmentAmount,
            dueDate: feeInstallments.dueDate,
            status: feeInstallments.status,
            rejectedReason: feeInstallments.rejectedReason,
            receiptImage: feeInstallments.receiptImage,
            installmentNumber: feeInstallments.installmentNumber,
            createdAt: feeInstallments.createdAt,
            updatedAt: feeInstallments.updatedAt,

            organization: {
                id: organizations.id,
                name: organizations.name,
            },

            paymentMethod: {
                id: paymentMethod.id,
                name: paymentMethod.name,

            },

            subscription: {
                id: subscriptions.id,
                planId: subscriptions.planId,
            },

            plan: {
                id: plans.id,
                name: plans.name,
                subscriptionFees: plans.subscriptionFees,
            }
        })
        .from(feeInstallments)
        .leftJoin(organizations, eq(feeInstallments.organizationId, organizations.id))
        .leftJoin(paymentMethod, eq(feeInstallments.paymentMethodId, paymentMethod.id))
        .leftJoin(subscriptions, eq(feeInstallments.subscriptionId, subscriptions.id))
        .leftJoin(plans, eq(subscriptions.planId, plans.id))
        .$dynamic();

    if (status && ["pending", "approved", "rejected", "overdue"].includes(status as string)) {
        query = query.where(
            eq(feeInstallments.status, status as "pending" | "approved" | "rejected" | "overdue")
        );
    }

    const allInstallments = await query.orderBy(desc(feeInstallments.createdAt));

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

    const result = await db
        .select({

            id: feeInstallments.id,
            subscriptionId: feeInstallments.subscriptionId,
            organizationId: feeInstallments.organizationId,
            paymentMethodId: feeInstallments.paymentMethodId,
            totalFeeAmount: feeInstallments.totalFeeAmount,
            paidAmount: feeInstallments.paidAmount,
            remainingAmount: feeInstallments.remainingAmount,
            installmentAmount: feeInstallments.installmentAmount,
            dueDate: feeInstallments.dueDate,
            status: feeInstallments.status,
            rejectedReason: feeInstallments.rejectedReason,
            receiptImage: feeInstallments.receiptImage,
            installmentNumber: feeInstallments.installmentNumber,
            createdAt: feeInstallments.createdAt,
            updatedAt: feeInstallments.updatedAt,

            organization: {
                id: organizations.id,
                name: organizations.name,
            },

            paymentMethod: {
                id: paymentMethod.id,
                name: paymentMethod.name,
            },

            subscription: {
                id: subscriptions.id,
                planId: subscriptions.planId,
            },

            plan: {
                id: plans.id,
                name: plans.name,
                subscriptionFees: plans.subscriptionFees,
            }
        })
        .from(feeInstallments)
        .leftJoin(organizations, eq(feeInstallments.organizationId, organizations.id))
        .leftJoin(paymentMethod, eq(feeInstallments.paymentMethodId, paymentMethod.id))
        .leftJoin(subscriptions, eq(feeInstallments.subscriptionId, subscriptions.id))
        .leftJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(feeInstallments.id, id))
        .limit(1);

    if (!result || result.length === 0) {
        throw new BadRequest("Installment not found");
    }

    const installment = result[0];

    return SuccessResponse(res, {
        message: "Installment retrieved successfully",
        installment,
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


// // Parents
export const getAllParentPayments = async (req: Request, res: Response) => {
    const payments = await db.query.parentPayment.findMany();
    return SuccessResponse(res, { message: "Parent Payments retrieved successfully", payments });
};

export const getParentPaymentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Payment ID is required");
    }
    const paymentRecord = await db.query.parentPayment.findFirst({
        where: eq(parentPayment.id, id),
    });
    if (!paymentRecord) {
        throw new BadRequest("Payment not found");
    }
    return SuccessResponse(res, { message: "Payment retrieved successfully", payment: paymentRecord });
};

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
    const paymentRecord = await db.query.parentPayment.findFirst({
        where: eq(parentPayment.id, id),
    });
    if (!paymentRecord) {
        throw new BadRequest("Payment not found");
    }
    // Prevent double-processing
    if (paymentRecord.status !== "pending") {
        throw new BadRequest("Payment has already been processed");
    }
    // Update payment status first
    await db.update(parentPayment)
        .set({
            status,
            rejectedReason: status === "rejected" ? rejectedReason : null,
        })
        .where(eq(parentPayment.id, id));
    // Create Subscription for the Parent if accepted
    if (status === "completed") {
        // Assuming parents also get subscriptions similar to organizations
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        await db.insert(parentSubscriptions).values({
            parentId: paymentRecord.parentId,
            parentPlanId: paymentRecord.planId,
            parentPaymentId: paymentRecord.id,
            startDate: startDate,
            endDate: endDate,
            isActive: true,
        });
    }
    return SuccessResponse(res, { message: `Payment ${status} successfully` }, 200);
};