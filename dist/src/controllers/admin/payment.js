"use strict";
// src/controllers/admin/paymentController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = exports.getPaymentById = exports.getAllPayments = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
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
        RequestedSubscriptionType: schema_1.payment.RequestedSubscriptionType,
        createdAt: schema_1.payment.createdAt,
        updatedAt: schema_1.payment.updatedAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            priceSemester: schema_1.plans.price_semester,
            priceYear: schema_1.plans.price_year,
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
        RequestedSubscriptionType: schema_1.payment.RequestedSubscriptionType,
        createdAt: schema_1.payment.createdAt,
        updatedAt: schema_1.payment.updatedAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            priceSemester: schema_1.plans.price_semester,
            priceYear: schema_1.plans.price_year,
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
    const { planId, paymentMethodId, amount, receiptImage, promocodeId, RequestedSubscriptionType } = req.body;
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
    // Insert payment
    await db_1.db.insert(schema_1.payment).values({
        id: newPaymentId,
        organizationId,
        planId,
        paymentMethodId,
        amount,
        receiptImage: receiptImageUrl || "",
        promocodeId: promocodeId || null,
        status: "pending",
        RequestedSubscriptionType,
    });
    // Fetch created payment with details
    const createdPayment = await db_1.db
        .select({
        id: schema_1.payment.id,
        amount: schema_1.payment.amount,
        status: schema_1.payment.status,
        receiptImage: schema_1.payment.receiptImage,
        RequestedSubscriptionType: schema_1.payment.RequestedSubscriptionType,
        createdAt: schema_1.payment.createdAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
        },
        paymentMethod: {
            id: schema_1.paymentMethod.id,
            name: schema_1.paymentMethod.name,
        },
    })
        .from(schema_1.payment)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.payment.planId, schema_1.plans.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.payment.paymentMethodId, schema_1.paymentMethod.id))
        .where((0, drizzle_orm_1.eq)(schema_1.payment.id, newPaymentId))
        .limit(1);
    (0, response_1.SuccessResponse)(res, {
        message: "Payment created successfully",
        payment: createdPayment[0],
    }, 201);
};
exports.createPayment = createPayment;
