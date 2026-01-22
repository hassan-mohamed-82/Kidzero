"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParentPaymentOrgService = exports.createParentPayment = exports.getParentPaymentbyId = exports.getParentPayments = void 0;
const schema_1 = require("../../../models/schema");
const db_1 = require("../../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const BadRequest_1 = require("../../../Errors/BadRequest");
const handleImages_1 = require("../../../utils/handleImages");
// get parent payments for logged in parent
const getParentPayments = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const payments = await db_1.db.query.parentPayment.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.parentPayment.parentId, user), });
    const orgServicePayments = await db_1.db.query.parentPaymentOrgServices.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.parentId, user), });
    return (0, response_1.SuccessResponse)(res, { message: "Payments retrieved successfully", payments, orgServicePayments }, 200);
};
exports.getParentPayments = getParentPayments;
const getParentPaymentbyId = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const { id } = req.params;
    const payment = await db_1.db.query.parentPayment.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPayment.id, id),
    });
    if (payment?.parentId !== user) {
        throw new BadRequest_1.BadRequest("Unauthorized Access to Payment");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Payment retrieved successfully", payment });
};
exports.getParentPaymentbyId = getParentPaymentbyId;
const createParentPayment = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const { planId, paymentMethodId, amount, receiptImage } = req.body;
    if (!planId || !paymentMethodId || !amount || !receiptImage) {
        throw new BadRequest_1.BadRequest("All fields are required");
    }
    const plan = await db_1.db.query.parentPlans.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.parentPlans.id, planId), });
    if (!plan) {
        throw new BadRequest_1.BadRequest("Plan Not Found");
    }
    const payMethod = await db_1.db.query.paymentMethod.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, paymentMethodId), });
    if (!payMethod) {
        throw new BadRequest_1.BadRequest("Payment Method Not Found");
    }
    // Save receipt image
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    if (!receiptImageUrl) {
        throw new BadRequest_1.BadRequest("Failed to process receipt image");
    }
    await db_1.db.insert(schema_1.parentPayment).values({
        parentId: user,
        planId,
        paymentMethodId,
        amount,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        rejectedReason: null,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Payment created successfully" }, 201);
};
exports.createParentPayment = createParentPayment;
const createParentPaymentOrgService = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const { ServiceId, paymentMethodId, amount, receiptImage, zoneId } = req.body;
    if (!ServiceId || !paymentMethodId || !amount || !receiptImage) {
        throw new BadRequest_1.BadRequest("All fields are required");
    }
    if (amount <= 0) {
        throw new BadRequest_1.BadRequest("Amount must be greater than zero");
    }
    const payMethod = await db_1.db.query.paymentMethod.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, paymentMethodId), });
    if (!payMethod) {
        throw new BadRequest_1.BadRequest("Payment Method Not Found");
    }
    const orgService = await db_1.db.query.organizationServices.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.organizationServices.id, ServiceId), });
    if (!orgService) {
        throw new BadRequest_1.BadRequest("Organization Service Not Found");
    }
    let cost;
    if (orgService.useZonePricing === true) { // Use zone pricing
        if (!zoneId) {
            throw new BadRequest_1.BadRequest("Zone ID is required for this service");
        }
        const zone = await db_1.db.query.zones.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.zones.id, zoneId), });
        if (!zone) {
            throw new BadRequest_1.BadRequest("Zone Not Found");
        }
        cost = zone.cost;
        if (payMethod.feeStatus === true) {
            if (payMethod.feeAmount < 0) {
                throw new BadRequest_1.BadRequest("Invalid payment method fee amount");
            }
            cost += payMethod.feeAmount;
        }
        if (amount < cost) {
            throw new BadRequest_1.BadRequest(`Amount must be at least ${cost}`);
        }
    }
    else { // Use standard pricing
        cost = orgService.servicePrice;
        if (payMethod.feeStatus === true) {
            if (payMethod.feeAmount < 0) {
                throw new BadRequest_1.BadRequest("Invalid payment method fee amount");
            }
            cost += payMethod.feeAmount;
        }
        if (amount < cost) {
            throw new BadRequest_1.BadRequest(`Amount must be at least ${cost}`);
        }
    }
    // Save receipt image
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    if (!receiptImageUrl) {
        throw new BadRequest_1.BadRequest("Failed to process receipt image");
    }
    await db_1.db.insert(schema_1.parentPaymentOrgServices).values({
        parentId: user,
        ServiceId,
        paymentMethodId,
        amount,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        rejectedReason: null,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Payment created successfully" }, 201);
};
exports.createParentPaymentOrgService = createParentPaymentOrgService;
