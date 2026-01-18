"use strict";
// src/controllers/admin/feeInstallment.ts
// Controller for organizations to manage their subscription fee installments
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstallmentById = exports.createInstallmentPayment = exports.getInstallmentHistory = exports.getInstallmentStatus = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
/**
 * Get current installment status and payment summary for the organization
 */
const getInstallmentStatus = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // Get active subscription
    const activeSubscription = await db_1.db.query.subscriptions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true)),
    });
    if (!activeSubscription) {
        throw new NotFound_1.NotFound("No active subscription found");
    }
    // Get plan details for subscription fees
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, activeSubscription.planId),
    });
    if (!plan) {
        throw new NotFound_1.NotFound("Plan not found");
    }
    // Get all installments for this subscription
    const allInstallments = await db_1.db
        .select()
        .from(schema_1.feeInstallments)
        .where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.subscriptionId, activeSubscription.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.feeInstallments.createdAt));
    // Calculate totals from approved installments
    const approvedInstallments = allInstallments.filter(i => i.status === "approved");
    const totalPaid = approvedInstallments.reduce((sum, i) => sum + i.installmentAmount, 0);
    const remainingAmount = plan.subscriptionFees - totalPaid;
    // Check for pending installments
    const pendingInstallment = allInstallments.find(i => i.status === "pending");
    const overdueInstallments = allInstallments.filter(i => i.status === "overdue");
    return (0, response_1.SuccessResponse)(res, {
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
exports.getInstallmentStatus = getInstallmentStatus;
/**
 * Get all installment history for the organization
 */
const getInstallmentHistory = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allInstallments = await db_1.db
        .select()
        .from(schema_1.feeInstallments)
        .where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.organizationId, organizationId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.feeInstallments.createdAt));
    // Group by status for summary
    const summary = {
        total: allInstallments.length,
        pending: allInstallments.filter(i => i.status === "pending").length,
        approved: allInstallments.filter(i => i.status === "approved").length,
        rejected: allInstallments.filter(i => i.status === "rejected").length,
        overdue: allInstallments.filter(i => i.status === "overdue").length,
    };
    return (0, response_1.SuccessResponse)(res, {
        message: "Installment history fetched successfully",
        installments: allInstallments,
        summary,
    }, 200);
};
exports.getInstallmentHistory = getInstallmentHistory;
/**
 * Create a new installment payment
 * Organization pays either full remaining amount or partial (with next due date)
 */
const createInstallmentPayment = async (req, res) => {
    const { amount, receiptImage, nextDueDate, paymentMethodId } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!amount || amount <= 0) {
        throw new BadRequest_1.BadRequest("Valid payment amount is required");
    }
    if (!paymentMethodId) {
        throw new BadRequest_1.BadRequest("Payment method ID is required");
    }
    // Validate payment method exists and is active
    const payMethodResult = await db_1.db
        .select()
        .from(schema_1.paymentMethod)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, paymentMethodId), (0, drizzle_orm_1.eq)(schema_1.paymentMethod.isActive, true)))
        .limit(1);
    if (!payMethodResult[0]) {
        throw new NotFound_1.NotFound("Payment method not found or inactive");
    }
    // Get active subscription
    const activeSubscription = await db_1.db.query.subscriptions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true)),
    });
    if (!activeSubscription) {
        throw new NotFound_1.NotFound("No active subscription found. Please subscribe to a plan first.");
    }
    // Check if there's already a pending installment
    const pendingInstallment = await db_1.db.query.feeInstallments.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feeInstallments.subscriptionId, activeSubscription.id), (0, drizzle_orm_1.eq)(schema_1.feeInstallments.status, "pending")),
    });
    if (pendingInstallment) {
        throw new BadRequest_1.BadRequest("You already have a pending installment awaiting approval. Please wait for admin review.");
    }
    // Get plan details
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, activeSubscription.planId),
    });
    if (!plan) {
        throw new NotFound_1.NotFound("Plan not found");
    }
    // Calculate current payment status
    const approvedInstallments = await db_1.db
        .select()
        .from(schema_1.feeInstallments)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feeInstallments.subscriptionId, activeSubscription.id), (0, drizzle_orm_1.eq)(schema_1.feeInstallments.status, "approved")));
    const totalPaid = approvedInstallments.reduce((sum, i) => sum + i.installmentAmount, 0);
    const remainingAmount = plan.subscriptionFees - totalPaid;
    const installmentNumber = approvedInstallments.length + 1;
    // Check if already fully paid
    if (remainingAmount <= 0) {
        throw new BadRequest_1.BadRequest("Subscription fees are already fully paid");
    }
    // Validate minimum payment for first installment
    if (installmentNumber === 1 && amount < plan.minSubscriptionFeesPay) {
        throw new BadRequest_1.BadRequest(`First payment must be at least ${plan.minSubscriptionFeesPay} (minimum subscription fee)`);
    }
    // Validate amount doesn't exceed remaining
    if (amount > remainingAmount) {
        throw new BadRequest_1.BadRequest(`Payment amount (${amount}) exceeds remaining balance (${remainingAmount})`);
    }
    // If paying partial, nextDueDate should be provided
    const isPartialPayment = amount < remainingAmount;
    if (isPartialPayment && !nextDueDate) {
        throw new BadRequest_1.BadRequest("Next payment due date is required for partial payments");
    }
    // Validate due date is in the future
    if (nextDueDate) {
        const dueDate = new Date(nextDueDate);
        if (dueDate <= new Date()) {
            throw new BadRequest_1.BadRequest("Next due date must be in the future");
        }
    }
    // Save receipt image if provided
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "installments/receipts");
        receiptImageUrl = savedImage.url;
    }
    // Create installment record
    const newInstallmentId = crypto.randomUUID();
    await db_1.db.insert(schema_1.feeInstallments).values({
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
    const createdInstallment = await db_1.db.query.feeInstallments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, newInstallmentId),
    });
    return (0, response_1.SuccessResponse)(res, {
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
exports.createInstallmentPayment = createInstallmentPayment;
/**
 * Get a specific installment by ID
 */
const getInstallmentById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Installment ID is required");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const installment = await db_1.db.query.feeInstallments.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feeInstallments.id, id), (0, drizzle_orm_1.eq)(schema_1.feeInstallments.organizationId, organizationId)),
    });
    if (!installment) {
        throw new NotFound_1.NotFound("Installment not found");
    }
    return (0, response_1.SuccessResponse)(res, {
        message: "Installment fetched successfully",
        installment,
    }, 200);
};
exports.getInstallmentById = getInstallmentById;
