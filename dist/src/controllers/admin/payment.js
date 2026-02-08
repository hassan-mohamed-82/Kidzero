"use strict";
// // src/controllers/admin/paymentController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplyToParentPaymentInstallment = exports.ReplyToParentPayment = exports.getParentPaymentById = exports.getAllParentPayments = exports.payPlanPrice = exports.requestRenewal = exports.createPayment = exports.getPaymentById = exports.getAllPayments = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const promocodes_1 = require("./promocodes");
const parentServicesSubscription_1 = require("../../models/admin/parentServicesSubscription");
const getAllPayments = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allPayments = await db_1.db
        .select({
        id: schema_1.payment.id,
        amount: schema_1.payment.amount,
        status: schema_1.payment.status,
        receiptImage: schema_1.payment.receiptImage,
        rejectedReason: schema_1.payment.rejectedReason,
        createdAt: schema_1.payment.createdAt,
        updatedAt: schema_1.payment.updatedAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            price: schema_1.plans.price
        },
        paymentMethod: {
            id: schema_1.paymentMethod.id,
            name: schema_1.paymentMethod.name,
        },
    })
        .from(schema_1.payment)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.payment.planId, schema_1.plans.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.payment.paymentMethodId, schema_1.paymentMethod.id))
        .where((0, drizzle_orm_1.eq)(schema_1.payment.organizationId, organizationId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.payment.createdAt));
    // Group payments by status for summary
    const summary = {
        total: allPayments.length,
        pending: allPayments.filter((p) => p.status === "pending").length,
        completed: allPayments.filter((p) => p.status === "completed").length,
        rejected: allPayments.filter((p) => p.status === "rejected").length,
    };
    return (0, response_1.SuccessResponse)(res, { message: "Payments fetched successfully", payments: allPayments, summary }, 200);
};
exports.getAllPayments = getAllPayments;
const getPaymentById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment ID is required");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const paymentResult = await db_1.db
        .select({
        id: schema_1.payment.id,
        amount: schema_1.payment.amount,
        status: schema_1.payment.status,
        receiptImage: schema_1.payment.receiptImage,
        rejectedReason: schema_1.payment.rejectedReason,
        promocodeId: schema_1.payment.promocodeId,
        createdAt: schema_1.payment.createdAt,
        updatedAt: schema_1.payment.updatedAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            price: schema_1.plans.price,
            maxBuses: schema_1.plans.maxBuses,
            maxDrivers: schema_1.plans.maxDrivers,
            maxStudents: schema_1.plans.maxStudents,
        },
        paymentMethod: {
            id: schema_1.paymentMethod.id,
            name: schema_1.paymentMethod.name,
            feeStatus: schema_1.paymentMethod.feeStatus,
            feeAmount: schema_1.paymentMethod.feeAmount,
        },
    })
        .from(schema_1.payment)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.payment.planId, schema_1.plans.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.payment.paymentMethodId, schema_1.paymentMethod.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payment.id, id), (0, drizzle_orm_1.eq)(schema_1.payment.organizationId, organizationId)))
        .limit(1);
    if (!paymentResult[0]) {
        throw new NotFound_1.NotFound("Payment not found");
    }
    (0, response_1.SuccessResponse)(res, { message: "Payment fetched successfully", payment: paymentResult[0] }, 200);
};
exports.getPaymentById = getPaymentById;
const createPayment = async (req, res) => {
    const { planId, paymentMethodId, amount, receiptImage, promocodeCode, nextDueDate } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!planId || !paymentMethodId || !amount) {
        throw new BadRequest_1.BadRequest("planId, paymentMethodId, and amount are required");
    }
    // Validate plan exists
    const planResult = await db_1.db
        .select()
        .from(schema_1.plans)
        .where((0, drizzle_orm_1.eq)(schema_1.plans.id, planId))
        .limit(1);
    if (!planResult[0]) {
        throw new NotFound_1.NotFound("Plan not found");
    }
    const plan = planResult[0];
    if (plan.minSubscriptionFeesPay > amount) {
        throw new BadRequest_1.BadRequest(`Minimum subscription fees pay is ${plan.minSubscriptionFeesPay}`);
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
    // Save receipt image if provided
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    // Generate new payment ID
    const newPaymentId = crypto.randomUUID();
    // Calculate total amount with fee if applicable
    let totalAmount = plan.subscriptionFees;
    if (payMethodResult[0].feeStatus === true) {
        if (payMethodResult[0].feeAmount > 0) {
            totalAmount = totalAmount + payMethodResult[0].feeAmount;
        }
        else {
            throw new BadRequest_1.BadRequest("Invalid fee amount in payment method");
        }
    }
    // Apply promocode if provided
    let promoResultId = null;
    if (promocodeCode) {
        const promoResult = await (0, promocodes_1.verifyPromocodeAvailable)(promocodeCode, organizationId);
        promoResultId = promoResult.id;
        if (promoResult.promocodeType === "amount") {
            totalAmount = totalAmount - promoResult.amount;
            // Add it to the Used Promocodes Table 
            await db_1.db.insert(schema_1.adminUsedPromocodes).values({
                id: crypto.randomUUID(),
                promocodeId: promoResult.id,
                organizationId,
            });
            if (totalAmount < 0) {
                totalAmount = 0;
            }
        }
        else {
            totalAmount = totalAmount - (totalAmount * promoResult.amount / 100);
            // Add it to the Used Promocodes Table 
            await db_1.db.insert(schema_1.adminUsedPromocodes).values({
                id: crypto.randomUUID(),
                promocodeId: promoResult.id,
                organizationId,
            });
            if (totalAmount < 0) {
                totalAmount = 0;
            }
        }
    }
    // Check if payment is less than subscription fees - route to installment path
    const subscriptionFees = plan.subscriptionFees;
    const minPayment = plan.minSubscriptionFeesPay;
    const isPartialPayment = amount < totalAmount;
    if (isPartialPayment) {
        // Validate minimum payment requirement
        if (amount < minPayment) {
            throw new BadRequest_1.BadRequest(`Payment amount (${amount}) is less than the minimum required payment (${minPayment}). ` +
                `You must pay at least ${minPayment} to start a subscription with installments.`);
        }
        // For partial payments, nextDueDate is required
        if (!nextDueDate) {
            throw new BadRequest_1.BadRequest("Next payment due date is required for partial/installment payments. " +
                `You are paying ${amount} out of ${totalAmount} total fees.`);
        }
        // Validate due date is in the future
        const dueDate = new Date(nextDueDate);
        if (dueDate <= new Date()) {
            throw new BadRequest_1.BadRequest("Next due date must be in the future");
        }
        // Insert payment record first
        await db_1.db.insert(schema_1.payment).values({
            id: newPaymentId,
            organizationId,
            planId,
            paymentMethodId,
            amount: amount,
            receiptImage: receiptImageUrl || "",
            promocodeId: promoResultId,
            status: "pending",
        });
        // Check for existing active subscription or create new one
        let activeSubscription = await db_1.db.query.subscriptions.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true)),
        });
        // If no active subscription, we need to create one after payment is approved
        // For now, create subscription with pending status linked to this payment
        let subscriptionId;
        if (!activeSubscription) {
            subscriptionId = crypto.randomUUID();
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
            await db_1.db.insert(schema_1.subscriptions).values({
                id: subscriptionId,
                planId,
                organizationId,
                startDate,
                endDate,
                paymentId: newPaymentId,
                isActive: false, // Will be activated when payment is approved
            });
        }
        else {
            subscriptionId = activeSubscription.id;
        }
        // Create fee installment record
        const newInstallmentId = crypto.randomUUID();
        await db_1.db.insert(schema_1.feeInstallments).values({
            id: newInstallmentId,
            subscriptionId,
            organizationId,
            paymentMethodId,
            totalFeeAmount: totalAmount,
            paidAmount: 0, // Will be updated when approved
            remainingAmount: totalAmount - amount, // Will be this after approval
            installmentAmount: totalAmount,
            dueDate: new Date(nextDueDate),
            status: "pending",
            receiptImage: receiptImageUrl || undefined,
            installmentNumber: 1,
        });
        // Fetch created payment with details
        const createdPayment = await db_1.db
            .select({
            id: schema_1.payment.id,
            amount: schema_1.payment.amount,
            status: schema_1.payment.status,
            receiptImage: schema_1.payment.receiptImage,
            createdAt: schema_1.payment.createdAt,
            plan: {
                id: schema_1.plans.id,
                name: schema_1.plans.name,
            },
            paymentMethod: {
                id: schema_1.paymentMethod.id,
                name: schema_1.paymentMethod.name,
            },
            promocode: {
                id: schema_1.promocode.id,
                code: schema_1.promocode.code,
            },
        })
            .from(schema_1.payment)
            .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.payment.planId, schema_1.plans.id))
            .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.payment.paymentMethodId, schema_1.paymentMethod.id))
            .leftJoin(schema_1.promocode, (0, drizzle_orm_1.eq)(schema_1.payment.promocodeId, schema_1.promocode.id))
            .where((0, drizzle_orm_1.eq)(schema_1.payment.id, newPaymentId))
            .limit(1);
        return (0, response_1.SuccessResponse)(res, {
            message: "Installment payment created successfully. Awaiting admin approval.",
            payment: createdPayment[0],
            installmentDetails: {
                installmentId: newInstallmentId,
                subscriptionId,
                totalFeeAmount: totalAmount,
                paidAmount: amount,
                remainingAmount: totalAmount - amount,
                nextDueDate,
                isInstallment: true,
            },
        }, 201);
    }
    // Full payment path (existing logic)
    // Insert payment
    await db_1.db.insert(schema_1.payment).values({
        id: newPaymentId,
        organizationId,
        planId,
        paymentMethodId,
        amount: totalAmount,
        receiptImage: receiptImageUrl || "",
        promocodeId: promoResultId,
        status: "pending",
    });
    // Fetch created payment with details
    const createdPayment = await db_1.db
        .select({
        id: schema_1.payment.id,
        amount: schema_1.payment.amount,
        status: schema_1.payment.status,
        receiptImage: schema_1.payment.receiptImage,
        createdAt: schema_1.payment.createdAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
        },
        paymentMethod: {
            id: schema_1.paymentMethod.id,
            name: schema_1.paymentMethod.name,
        },
        promocode: {
            id: schema_1.promocode.id,
            code: schema_1.promocode.code,
        },
    })
        .from(schema_1.payment)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.payment.planId, schema_1.plans.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.payment.paymentMethodId, schema_1.paymentMethod.id))
        .leftJoin(schema_1.promocode, (0, drizzle_orm_1.eq)(schema_1.payment.promocodeId, schema_1.promocode.id))
        .where((0, drizzle_orm_1.eq)(schema_1.payment.id, newPaymentId))
        .limit(1);
    (0, response_1.SuccessResponse)(res, {
        message: "Payment created successfully",
        payment: createdPayment[0],
    }, 201);
};
exports.createPayment = createPayment;
/**
 * Request subscription renewal - Admin pays plan price to extend subscription
 */
const requestRenewal = async (req, res) => {
    const { paymentMethodId, receiptImage } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!paymentMethodId) {
        throw new BadRequest_1.BadRequest("Payment method ID is required");
    }
    // Get active subscription
    const activeSubscription = await db_1.db.query.subscriptions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true)),
    });
    if (!activeSubscription) {
        throw new NotFound_1.NotFound("No active subscription found to renew");
    }
    // Get plan details
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, activeSubscription.planId),
    });
    if (!plan) {
        throw new NotFound_1.NotFound("Plan not found");
    }
    // Check if there's already a pending renewal
    const existingRenewal = await db_1.db
        .select()
        .from(schema_1.payment)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payment.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.payment.status, "pending"), (0, drizzle_orm_1.eq)(schema_1.payment.paymentType, "renewal")))
        .limit(1);
    if (existingRenewal.length > 0) {
        throw new BadRequest_1.BadRequest("You already have a pending renewal request. Please wait for Super Admin review.");
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
    // Save receipt image if provided
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/renewals");
        receiptImageUrl = savedImage.url;
    }
    // Create renewal payment - amount is the plan price
    const newPaymentId = crypto.randomUUID();
    await db_1.db.insert(schema_1.payment).values({
        id: newPaymentId,
        organizationId,
        planId: activeSubscription.planId,
        paymentMethodId,
        amount: plan.price,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        paymentType: "renewal",
    });
    // Fetch created payment
    const createdPayment = await db_1.db
        .select({
        id: schema_1.payment.id,
        amount: schema_1.payment.amount,
        status: schema_1.payment.status,
        paymentType: schema_1.payment.paymentType,
        createdAt: schema_1.payment.createdAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            price: schema_1.plans.price,
        },
    })
        .from(schema_1.payment)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.payment.planId, schema_1.plans.id))
        .where((0, drizzle_orm_1.eq)(schema_1.payment.id, newPaymentId))
        .limit(1);
    return (0, response_1.SuccessResponse)(res, {
        message: "Renewal request submitted successfully. Awaiting super admin approval.",
        payment: createdPayment[0],
        subscription: {
            currentEndDate: activeSubscription.endDate,
            newEndDateIfApproved: new Date(new Date(activeSubscription.endDate).setFullYear(new Date(activeSubscription.endDate).getFullYear() + 1)),
        },
    }, 201);
};
exports.requestRenewal = requestRenewal;
/**
 * Pay plan price - Admin pays for the plan's price (separate from subscription fees)
 */
const payPlanPrice = async (req, res) => {
    const { planId, paymentMethodId, receiptImage } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!planId || !paymentMethodId) {
        throw new BadRequest_1.BadRequest("Plan ID and Payment method ID are required");
    }
    // Get plan details
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, planId),
    });
    if (!plan) {
        throw new NotFound_1.NotFound("Plan not found");
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
    // Save receipt image if provided
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/plan-price");
        receiptImageUrl = savedImage.url;
    }
    // Create plan price payment
    const newPaymentId = crypto.randomUUID();
    await db_1.db.insert(schema_1.payment).values({
        id: newPaymentId,
        organizationId,
        planId,
        paymentMethodId,
        amount: plan.price,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        paymentType: "plan_price",
    });
    // Fetch created payment
    const createdPayment = await db_1.db
        .select({
        id: schema_1.payment.id,
        amount: schema_1.payment.amount,
        status: schema_1.payment.status,
        paymentType: schema_1.payment.paymentType,
        createdAt: schema_1.payment.createdAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            price: schema_1.plans.price,
        },
    })
        .from(schema_1.payment)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.payment.planId, schema_1.plans.id))
        .where((0, drizzle_orm_1.eq)(schema_1.payment.id, newPaymentId))
        .limit(1);
    return (0, response_1.SuccessResponse)(res, {
        message: "Plan price payment submitted successfully. Awaiting super admin approval.",
        payment: createdPayment[0],
    }, 201);
};
exports.payPlanPrice = payPlanPrice;
const getAllParentPayments = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allParentPayments = await db_1.db.select({
        id: schema_1.parentPaymentOrgServices.id,
        amount: schema_1.parentPaymentOrgServices.amount,
        status: schema_1.parentPaymentOrgServices.status,
        organizationId: schema_1.parentPaymentOrgServices.organizationId,
        parentId: schema_1.parentPaymentOrgServices.parentId,
        serviceId: schema_1.parentPaymentOrgServices.serviceId,
        paymentMethodId: schema_1.parentPaymentOrgServices.paymentMethodId,
        receiptImage: schema_1.parentPaymentOrgServices.receiptImage,
        type: schema_1.parentPaymentOrgServices.type,
        createdAt: schema_1.parentPaymentOrgServices.createdAt,
        updatedAt: schema_1.parentPaymentOrgServices.updatedAt,
        organization: {
            id: schema_1.organizations.id,
            name: schema_1.organizations.name,
        },
        parent: {
            id: schema_1.parents.id,
            name: schema_1.parents.name,
            email: schema_1.parents.email,
            phone: schema_1.parents.phone,
        },
        service: {
            id: schema_1.organizationServices.id,
            serviceName: schema_1.organizationServices.serviceName,
            serviceDescription: schema_1.organizationServices.serviceDescription,
            useZonePricing: schema_1.organizationServices.useZonePricing,
            servicePrice: schema_1.organizationServices.servicePrice,
        },
        paymentMethod: {
            id: schema_1.paymentMethod.id,
            name: schema_1.paymentMethod.name,
        },
    }).from(schema_1.parentPaymentOrgServices)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.organizationId, schema_1.organizations.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.parentId, schema_1.parents.id))
        .leftJoin(schema_1.organizationServices, (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.serviceId, schema_1.organizationServices.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.paymentMethodId, schema_1.paymentMethod.id))
        .where((0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.organizationId, organizationId));
    return (0, response_1.SuccessResponse)(res, { message: "Parent Payments fetched successfully", payments: allParentPayments }, 200);
};
exports.getAllParentPayments = getAllParentPayments;
const getParentPaymentById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment ID is required");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const parentPaymentResult = await db_1.db.query.parentPaymentOrgServices.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.id, id), (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.organizationId, organizationId)),
    });
    if (!parentPaymentResult) {
        throw new NotFound_1.NotFound("Parent Payment not found");
    }
    (0, response_1.SuccessResponse)(res, { message: "Parent Payment fetched successfully", payment: parentPaymentResult }, 200);
};
exports.getParentPaymentById = getParentPaymentById;
const ReplyToParentPayment = async (req, res) => {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment ID is required");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!status) {
        throw new BadRequest_1.BadRequest("Status is required");
    }
    const parentPaymentResult = await db_1.db.query.parentPaymentOrgServices.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.id, id), (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.organizationId, organizationId)),
    });
    if (!parentPaymentResult) {
        throw new NotFound_1.NotFound("Parent Payment not found");
    }
    if (status !== "pending" && status !== "completed" && status !== "rejected") {
        throw new BadRequest_1.BadRequest("Invalid status value");
    }
    switch (status) {
        case "rejected":
            if (!rejectedReason) {
                throw new BadRequest_1.BadRequest("Rejection reason is required when rejecting a payment");
            }
            await db_1.db.update(schema_1.parentPaymentOrgServices).set({
                status: "rejected",
                rejectedReason: rejectedReason,
            }).where((0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.id, id));
            return (0, response_1.SuccessResponse)(res, { message: "Parent Payment rejected successfully for the student" }, 200);
        case "completed":
            // Check this payment is onetime or Installment
            if (parentPaymentResult.type === "onetime") {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1);
                await db_1.db.insert(parentServicesSubscription_1.parentServicesSubscriptions).values({
                    parentId: parentPaymentResult.parentId,
                    studentId: parentPaymentResult.studentId,
                    serviceId: parentPaymentResult.serviceId,
                    parentServicePaymentId: parentPaymentResult.id,
                    totalAmount: parentPaymentResult.amount,
                    currentPaid: parentPaymentResult.amount,
                    startDate: startDate,
                    endDate: endDate,
                    isActive: true,
                });
                await db_1.db.update(schema_1.parentPaymentOrgServices).set({
                    status: "completed",
                    rejectedReason: null,
                }).where((0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.id, id));
                return (0, response_1.SuccessResponse)(res, { message: "Parent Payment approved and subscription activated successfully for the student" }, 200);
            }
            else {
                // Create Installment
                const orgService = await db_1.db.query.organizationServices.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema_1.organizationServices.id, parentPaymentResult.serviceId),
                });
                if (!orgService) {
                    throw new NotFound_1.NotFound("Organization Service not found");
                }
                // Activate Subscription First to get ID of Subscription
                const subscriptionId = crypto.randomUUID();
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1);
                await db_1.db.insert(parentServicesSubscription_1.parentServicesSubscriptions).values({
                    id: subscriptionId,
                    parentId: parentPaymentResult.parentId,
                    studentId: parentPaymentResult.studentId,
                    serviceId: parentPaymentResult.serviceId,
                    parentServicePaymentId: parentPaymentResult.id,
                    paymentType: parentPaymentResult.type,
                    totalAmount: orgService.servicePrice,
                    currentPaid: parentPaymentResult.amount,
                    startDate: startDate,
                    endDate: endDate,
                    isActive: true,
                });
                // Insert Installment
                // اول دفعه بتتحسب من المبلغ الاساسي
                // اللي اتدفع لحد دلوقتي هو اول مره دفع فيها الفلوس
                const amountPaid = parentPaymentResult.amount;
                const today = new Date();
                const dueDate = new Date(today);
                dueDate.setMonth(dueDate.getMonth() + 1); // Move to next month
                dueDate.setDate(orgService.dueDay ?? 5); // Set to the organization's due day (default: 5)
                await db_1.db.insert(schema_1.servicePaymentInstallments).values({
                    subscriptionId: subscriptionId,
                    serviceId: parentPaymentResult.serviceId,
                    dueDate: dueDate,
                    amount: orgService.servicePrice,
                    paidAmount: amountPaid,
                    fineAmount: orgService.latePaymentFine, // 100 جنيه غرامه لو دفعت متاخر
                    discountAmount: orgService.earlyPaymentDiscount, // 100 جنيه خصم لو دفعت بدري
                    transactionId: parentPaymentResult.id,
                    status: "pending" // لسه مكملش التقسيط
                });
                // مفروض هنا بقي بنروح نعمل Create Installment Payment عشان نكمل التقسيط
                // Update Parent Payment to be Completed
                await db_1.db.update(schema_1.parentPaymentOrgServices).set({
                    status: "completed",
                    rejectedReason: null,
                }).where((0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.id, id));
                return (0, response_1.SuccessResponse)(res, { message: "Parent Payment First Installment approved successfully for the student" }, 200);
            }
        default:
            throw new BadRequest_1.BadRequest("Only 'completed' or 'rejected' status updates are allowed");
    }
};
exports.ReplyToParentPayment = ReplyToParentPayment;
const ReplyToParentPaymentInstallment = async (req, res) => {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest_1.BadRequest("Invalid Installment ID");
    }
    if (!status) {
        throw new BadRequest_1.BadRequest("Invalid Status");
    }
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Invalid Organization ID");
    }
    const paymentInstallment = await db_1.db.query.parentPaymentInstallments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPaymentInstallments.id, id),
    });
    if (!paymentInstallment) {
        throw new BadRequest_1.BadRequest("Invalid Installment ID");
    }
    switch (status) {
        case "rejected":
            if (!rejectedReason) {
                throw new BadRequest_1.BadRequest("Rejection reason is required when rejecting a payment");
            }
            await db_1.db.update(schema_1.parentPaymentInstallments).set({
                status: "rejected",
                rejectedReason: rejectedReason,
            }).where((0, drizzle_orm_1.eq)(schema_1.parentPaymentInstallments.id, id));
            return (0, response_1.SuccessResponse)(res, { message: "Parent Payment rejected successfully for the student" }, 200);
        case "completed":
            const installment = await db_1.db.query.servicePaymentInstallments.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.servicePaymentInstallments.id, paymentInstallment.installmentId) });
            if (!installment)
                throw new NotFound_1.NotFound("Installment not found");
            const subscription = await db_1.db.query.parentServicesSubscriptions.findFirst({ where: (0, drizzle_orm_1.eq)(parentServicesSubscription_1.parentServicesSubscriptions.id, installment.subscriptionId) });
            if (!subscription)
                throw new NotFound_1.NotFound("Subscription not found");
            const service = await db_1.db.query.organizationServices.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.organizationServices.id, subscription.serviceId) });
            if (!service)
                throw new NotFound_1.NotFound("Service not found");
            // Calculate Amount with Fine / Discount
            const today = new Date();
            const NewdueDate = new Date(today);
            NewdueDate.setMonth(NewdueDate.getMonth() + 1); // Move to next month
            NewdueDate.setDate(service.dueDay ?? 5); // Set to the organization's due day (default: 5)
            const dueDate = installment.dueDate;
            let finalAmount = installment.amount;
            let InstallmentPaidAmount = installment.paidAmount;
            // Process Payment (Create Payment Record)
            // Save receipt image
            let receiptImageUrl = null;
            const receiptImage = paymentInstallment.receiptImage;
            if (receiptImage) {
                const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/receipts");
                receiptImageUrl = savedImage.url;
            }
            const paidAmount = paymentInstallment.paidAmount;
            //Update Installment
            if (finalAmount === paidAmount) { // Fully Paid
                await db_1.db.update(schema_1.servicePaymentInstallments)
                    .set({
                    status: 'paid',
                    paidAmount,
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.servicePaymentInstallments.id, installment.id));
                //Update Payment
                await db_1.db.update(schema_1.parentPaymentInstallments)
                    .set({
                    status: 'completed',
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.parentPaymentInstallments.id, id));
                return (0, response_1.SuccessResponse)(res, { message: "Parent Payment First Installment approved successfully for the student" }, 200);
            }
            else {
                // Partial
                InstallmentPaidAmount = (InstallmentPaidAmount ?? 0) + paidAmount;
                await db_1.db.update(schema_1.servicePaymentInstallments)
                    .set({
                    status: 'pending',
                    paidAmount: InstallmentPaidAmount,
                    dueDate: NewdueDate,
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.servicePaymentInstallments.id, installment.id));
                //Update Parent Payment Installment to Completed
                await db_1.db.update(schema_1.parentPaymentInstallments)
                    .set({
                    status: 'completed',
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.parentPaymentInstallments.id, id));
                return (0, response_1.SuccessResponse)(res, { message: "Parent Payment Installment approved successfully for the student" }, 200);
            }
        default:
            throw new BadRequest_1.BadRequest("Only 'completed' or 'rejected' status updates are allowed");
    }
};
exports.ReplyToParentPaymentInstallment = ReplyToParentPaymentInstallment;
