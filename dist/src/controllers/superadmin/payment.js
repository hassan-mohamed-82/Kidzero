"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplyToPaymentParent = exports.getParentPaymentById = exports.getAllParentPayments = exports.rejectInstallment = exports.approveInstallment = exports.getInstallmentById = exports.getAllInstallments = exports.ReplyToPayment = exports.getPaymentById = exports.getAllPayments = void 0;
const schema_1 = require("../../models/schema");
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const getAllPayments = async (req, res) => {
    const payments = await db_1.db.query.payment.findMany();
    return (0, response_1.SuccessResponse)(res, { message: "Payments retrieved successfully", payments });
};
exports.getAllPayments = getAllPayments;
const getPaymentById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment ID is required");
    }
    const paymentRecord = await db_1.db.query.payment.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.payment.id, id),
    });
    if (!paymentRecord) {
        throw new BadRequest_1.BadRequest("Payment not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Payment retrieved successfully", payment: paymentRecord });
};
exports.getPaymentById = getPaymentById;
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
const ReplyToPayment = async (req, res) => {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment ID is required");
    }
    if (!status || !["completed", "rejected"].includes(status)) {
        throw new BadRequest_1.BadRequest("Valid status is required");
    }
    if (status === "rejected" && !rejectedReason) {
        throw new BadRequest_1.BadRequest("Rejection reason is required for rejected payments");
    }
    const paymentRecord = await db_1.db.query.payment.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.payment.id, id),
    });
    if (!paymentRecord) {
        throw new BadRequest_1.BadRequest("Payment not found");
    }
    // Prevent double-processing
    if (paymentRecord.status !== "pending") {
        throw new BadRequest_1.BadRequest("Payment has already been processed");
    }
    // Update payment status first
    await db_1.db.update(schema_1.payment)
        .set({
        status,
        rejectedReason: status === "rejected" ? rejectedReason : null,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.payment.id, id));
    // Handle approved payments based on paymentType
    if (status === "completed") {
        const paymentType = paymentRecord.paymentType || "subscription";
        if (paymentType === "renewal") {
            // Renewal: Extend existing subscription's end date by 1 year
            const existingSubscription = await db_1.db.query.subscriptions.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, paymentRecord.organizationId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true)),
            });
            if (existingSubscription) {
                // Extend end date by 1 year from current end date
                const newEndDate = new Date(existingSubscription.endDate);
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                await db_1.db.update(schema_1.subscriptions)
                    .set({
                    endDate: newEndDate,
                    paymentId: paymentRecord.id,
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, existingSubscription.id));
                return (0, response_1.SuccessResponse)(res, {
                    message: "Renewal approved. Subscription extended successfully.",
                    subscriptionId: existingSubscription.id,
                    newEndDate,
                }, 200);
            }
            else {
                // No active subscription found, create new one
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1);
                await db_1.db.insert(schema_1.subscriptions).values({
                    organizationId: paymentRecord.organizationId,
                    planId: paymentRecord.planId,
                    startDate,
                    endDate,
                    paymentId: paymentRecord.id,
                    isActive: true,
                });
                await db_1.db.update(schema_1.organizations)
                    .set({ status: "subscribed" })
                    .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, paymentRecord.organizationId));
                return (0, response_1.SuccessResponse)(res, {
                    message: "Renewal approved. New subscription created.",
                    endDate,
                }, 200);
            }
        }
        else if (paymentType === "plan_price") {
            // Plan price payment: Just mark as completed, no subscription changes
            return (0, response_1.SuccessResponse)(res, {
                message: "Plan price payment approved successfully.",
            }, 200);
        }
        else {
            // Default: subscription type - create new subscription
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            await db_1.db.insert(schema_1.subscriptions).values({
                organizationId: paymentRecord.organizationId,
                planId: paymentRecord.planId,
                startDate,
                endDate,
                paymentId: paymentRecord.id,
                isActive: true,
            });
            await db_1.db.update(schema_1.organizations)
                .set({ status: "subscribed" })
                .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, paymentRecord.organizationId));
            return (0, response_1.SuccessResponse)(res, {
                message: "Payment approved. Subscription created successfully.",
                endDate,
            }, 200);
        }
    }
    // Rejected payment
    return (0, response_1.SuccessResponse)(res, { message: "Payment rejected successfully" }, 200);
};
exports.ReplyToPayment = ReplyToPayment;
// =====================================================
// FEE INSTALLMENT MANAGEMENT (Super Admin)
// =====================================================
/**
 * Get all fee installments (with optional status filter)
 */
const getAllInstallments = async (req, res) => {
    const { status } = req.query;
    let query = db_1.db
        .select({
        id: schema_1.feeInstallments.id,
        subscriptionId: schema_1.feeInstallments.subscriptionId,
        organizationId: schema_1.feeInstallments.organizationId,
        paymentMethodId: schema_1.feeInstallments.paymentMethodId,
        totalFeeAmount: schema_1.feeInstallments.totalFeeAmount,
        paidAmount: schema_1.feeInstallments.paidAmount,
        remainingAmount: schema_1.feeInstallments.remainingAmount,
        installmentAmount: schema_1.feeInstallments.installmentAmount,
        dueDate: schema_1.feeInstallments.dueDate,
        status: schema_1.feeInstallments.status,
        rejectedReason: schema_1.feeInstallments.rejectedReason,
        receiptImage: schema_1.feeInstallments.receiptImage,
        installmentNumber: schema_1.feeInstallments.installmentNumber,
        createdAt: schema_1.feeInstallments.createdAt,
        updatedAt: schema_1.feeInstallments.updatedAt,
        organization: {
            id: schema_1.organizations.id,
            name: schema_1.organizations.name,
        },
        paymentMethod: {
            id: schema_1.paymentMethod.id,
            name: schema_1.paymentMethod.name,
        },
        subscription: {
            id: schema_1.subscriptions.id,
            planId: schema_1.subscriptions.planId,
        },
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            subscriptionFees: schema_1.plans.subscriptionFees,
        }
    })
        .from(schema_1.feeInstallments)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.feeInstallments.organizationId, schema_1.organizations.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.feeInstallments.paymentMethodId, schema_1.paymentMethod.id))
        .leftJoin(schema_1.subscriptions, (0, drizzle_orm_1.eq)(schema_1.feeInstallments.subscriptionId, schema_1.subscriptions.id))
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.subscriptions.planId, schema_1.plans.id))
        .$dynamic();
    if (status && ["pending", "approved", "rejected", "overdue"].includes(status)) {
        query = query.where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.status, status));
    }
    const allInstallments = await query.orderBy((0, drizzle_orm_1.desc)(schema_1.feeInstallments.createdAt));
    // Group by status for summary
    const pendingCount = allInstallments.filter(i => i.status === "pending").length;
    const approvedCount = allInstallments.filter(i => i.status === "approved").length;
    const rejectedCount = allInstallments.filter(i => i.status === "rejected").length;
    const overdueCount = allInstallments.filter(i => i.status === "overdue").length;
    return (0, response_1.SuccessResponse)(res, {
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
exports.getAllInstallments = getAllInstallments;
/**
 * Get a specific installment by ID
 */
const getInstallmentById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Installment ID is required");
    }
    const result = await db_1.db
        .select({
        id: schema_1.feeInstallments.id,
        subscriptionId: schema_1.feeInstallments.subscriptionId,
        organizationId: schema_1.feeInstallments.organizationId,
        paymentMethodId: schema_1.feeInstallments.paymentMethodId,
        totalFeeAmount: schema_1.feeInstallments.totalFeeAmount,
        paidAmount: schema_1.feeInstallments.paidAmount,
        remainingAmount: schema_1.feeInstallments.remainingAmount,
        installmentAmount: schema_1.feeInstallments.installmentAmount,
        dueDate: schema_1.feeInstallments.dueDate,
        status: schema_1.feeInstallments.status,
        rejectedReason: schema_1.feeInstallments.rejectedReason,
        receiptImage: schema_1.feeInstallments.receiptImage,
        installmentNumber: schema_1.feeInstallments.installmentNumber,
        createdAt: schema_1.feeInstallments.createdAt,
        updatedAt: schema_1.feeInstallments.updatedAt,
        organization: {
            id: schema_1.organizations.id,
            name: schema_1.organizations.name,
        },
        paymentMethod: {
            id: schema_1.paymentMethod.id,
            name: schema_1.paymentMethod.name,
        },
        subscription: {
            id: schema_1.subscriptions.id,
            planId: schema_1.subscriptions.planId,
        },
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            subscriptionFees: schema_1.plans.subscriptionFees,
        }
    })
        .from(schema_1.feeInstallments)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.feeInstallments.organizationId, schema_1.organizations.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.feeInstallments.paymentMethodId, schema_1.paymentMethod.id))
        .leftJoin(schema_1.subscriptions, (0, drizzle_orm_1.eq)(schema_1.feeInstallments.subscriptionId, schema_1.subscriptions.id))
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.subscriptions.planId, schema_1.plans.id))
        .where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, id))
        .limit(1);
    if (!result || result.length === 0) {
        throw new BadRequest_1.BadRequest("Installment not found");
    }
    const installment = result[0];
    return (0, response_1.SuccessResponse)(res, {
        message: "Installment retrieved successfully",
        installment,
    });
};
exports.getInstallmentById = getInstallmentById;
/**
 * Approve an installment payment
 */
const approveInstallment = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Installment ID is required");
    }
    const installment = await db_1.db.query.feeInstallments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, id),
    });
    if (!installment) {
        throw new BadRequest_1.BadRequest("Installment not found");
    }
    if (installment.status !== "pending") {
        throw new BadRequest_1.BadRequest(`Installment has already been ${installment.status}`);
    }
    // Calculate new totals
    const newPaidAmount = installment.paidAmount + installment.installmentAmount;
    const newRemainingAmount = installment.totalFeeAmount - newPaidAmount;
    // Update this installment to approved
    await db_1.db.update(schema_1.feeInstallments)
        .set({
        status: "approved",
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, id));
    // Check if fully paid
    const isFullyPaid = newRemainingAmount <= 0;
    return (0, response_1.SuccessResponse)(res, {
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
exports.approveInstallment = approveInstallment;
/**
 * Reject an installment payment
 */
const rejectInstallment = async (req, res) => {
    const { id } = req.params;
    const { rejectedReason } = req.body;
    if (!id) {
        throw new BadRequest_1.BadRequest("Installment ID is required");
    }
    if (!rejectedReason) {
        throw new BadRequest_1.BadRequest("Rejection reason is required");
    }
    const installment = await db_1.db.query.feeInstallments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, id),
    });
    if (!installment) {
        throw new BadRequest_1.BadRequest("Installment not found");
    }
    if (installment.status !== "pending") {
        throw new BadRequest_1.BadRequest(`Installment has already been ${installment.status}`);
    }
    // Update installment to rejected
    await db_1.db.update(schema_1.feeInstallments)
        .set({
        status: "rejected",
        rejectedReason,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, id));
    return (0, response_1.SuccessResponse)(res, {
        message: "Installment rejected successfully",
        data: {
            installmentId: id,
            rejectedReason,
        }
    });
};
exports.rejectInstallment = rejectInstallment;
// // Parents
const getAllParentPayments = async (req, res) => {
    const payments = await db_1.db.query.parentPayment.findMany();
    return (0, response_1.SuccessResponse)(res, { message: "Parent Payments retrieved successfully", payments });
};
exports.getAllParentPayments = getAllParentPayments;
const getParentPaymentById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment ID is required");
    }
    const paymentRecord = await db_1.db.query.parentPayment.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPayment.id, id),
    });
    if (!paymentRecord) {
        throw new BadRequest_1.BadRequest("Payment not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Payment retrieved successfully", payment: paymentRecord });
};
exports.getParentPaymentById = getParentPaymentById;
const ReplyToPaymentParent = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment ID is required");
    }
    const { status, rejectedReason } = req.body;
    if (!status || !["completed", "rejected"].includes(status)) {
        throw new BadRequest_1.BadRequest("Valid status is required");
    }
    if (status === "rejected" && !rejectedReason) {
        throw new BadRequest_1.BadRequest("Rejection reason is required for rejected payments");
    }
    const paymentRecord = await db_1.db.query.parentPayment.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPayment.id, id),
    });
    if (!paymentRecord) {
        throw new BadRequest_1.BadRequest("Payment not found");
    }
    // Prevent double-processing
    if (paymentRecord.status !== "pending") {
        throw new BadRequest_1.BadRequest("Payment has already been processed");
    }
    // Update payment status first
    await db_1.db.update(schema_1.parentPayment)
        .set({
        status,
        rejectedReason: status === "rejected" ? rejectedReason : null,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.parentPayment.id, id));
    // Create Subscription for the Parent if accepted
    if (status === "completed") {
        // Assuming parents also get subscriptions similar to organizations
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        await db_1.db.insert(schema_1.parentSubscriptions).values({
            parentId: paymentRecord.parentId,
            parentPlanId: paymentRecord.planId,
            parentPaymentId: paymentRecord.id,
            startDate: startDate,
            endDate: endDate,
            isActive: true,
        });
    }
    return (0, response_1.SuccessResponse)(res, { message: `Payment ${status} successfully` }, 200);
};
exports.ReplyToPaymentParent = ReplyToPaymentParent;
