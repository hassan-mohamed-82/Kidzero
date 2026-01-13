"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectInstallment = exports.approveInstallment = exports.getInstallmentById = exports.getAllInstallments = exports.ReplyToPayment = exports.getPaymentById = exports.getAllPayments = void 0;
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
    // Create/Renew Subscription for the Organization if accepted
    if (status === "completed") {
        const existingSubscription = await db_1.db.query.subscriptions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, paymentRecord.organizationId),
        });
        const startDate = new Date();
        const endDate = new Date();
        if (paymentRecord.RequestedSubscriptionType === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 4);
        }
        if (existingSubscription) {
            // Renew Subscription
            await db_1.db.update(schema_1.subscriptions)
                .set({
                startDate,
                endDate,
                planId: paymentRecord.planId,
                subscriptionType: paymentRecord.RequestedSubscriptionType,
                paymentId: paymentRecord.id,
                isActive: true,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, existingSubscription.id));
            return (0, response_1.SuccessResponse)(res, { message: "Subscription renewed successfully" });
        }
        else {
            // Create new Subscription
            await db_1.db.insert(schema_1.subscriptions).values({
                organizationId: paymentRecord.organizationId,
                planId: paymentRecord.planId,
                startDate,
                endDate,
                subscriptionType: paymentRecord.RequestedSubscriptionType,
                paymentId: paymentRecord.id,
                isActive: true,
            });
            // Update Organization Status
            await db_1.db.update(schema_1.organizations)
                .set({
                status: "subscribed",
            })
                .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, paymentRecord.organizationId));
            return (0, response_1.SuccessResponse)(res, { message: "Subscription created successfully" });
        }
    }
    // If rejected, just return
    return (0, response_1.SuccessResponse)(res, { message: "Payment rejected successfully" });
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
    let allInstallments;
    if (status && ["pending", "approved", "rejected", "overdue"].includes(status)) {
        allInstallments = await db_1.db
            .select()
            .from(schema_1.feeInstallments)
            .where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.status, status))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.feeInstallments.createdAt));
    }
    else {
        allInstallments = await db_1.db
            .select()
            .from(schema_1.feeInstallments)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.feeInstallments.createdAt));
    }
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
    const installment = await db_1.db.query.feeInstallments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, id),
    });
    if (!installment) {
        throw new BadRequest_1.BadRequest("Installment not found");
    }
    // Get organization and subscription details
    const subscription = await db_1.db.query.subscriptions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.subscriptions.id, installment.subscriptionId),
    });
    const organization = await db_1.db.query.organizations.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.organizations.id, installment.organizationId),
    });
    const plan = subscription ? await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, subscription.planId),
    }) : null;
    return (0, response_1.SuccessResponse)(res, {
        message: "Installment retrieved successfully",
        installment,
        organization: organization ? { id: organization.id, name: organization.name } : null,
        plan: plan ? { id: plan.id, name: plan.name, subscriptionFees: plan.subscriptionFees } : null,
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
