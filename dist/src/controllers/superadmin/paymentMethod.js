"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.getPaymentMethodById = exports.getAllPaymentMethods = void 0;
const db_1 = require("../../models/db");
const response_1 = require("../../utils/response");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const getAllPaymentMethods = async (req, res) => {
    const paymentMethods = await db_1.db.query.paymentMethod.findMany();
    return (0, response_1.SuccessResponse)(res, { paymentMethods }, 200);
};
exports.getAllPaymentMethods = getAllPaymentMethods;
const getPaymentMethodById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment Method ID is required");
    }
    const paymentMethodRecord = await db_1.db.query.paymentMethod.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, id),
    });
    if (!paymentMethodRecord) {
        throw new BadRequest_1.BadRequest("Payment Method not found");
    }
    return (0, response_1.SuccessResponse)(res, { paymentMethod: paymentMethodRecord }, 200);
};
exports.getPaymentMethodById = getPaymentMethodById;
const createPaymentMethod = async (req, res) => {
    const { name, description, logo, is_active, fee_status, fee_amount } = req.body;
    if (!name || !logo || is_active === undefined || fee_status === undefined) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    let feeAmountNumber;
    if (fee_status == true) {
        if (isNaN(fee_amount) || fee_amount < 0) {
            throw new BadRequest_1.BadRequest("Invalid fee amount");
        }
        else {
            feeAmountNumber = Number(fee_amount);
        }
    }
    else {
        feeAmountNumber = 0;
    }
    const newPaymentMethod = await db_1.db.insert(schema_1.paymentMethod).values({
        name,
        description,
        logo,
        isActive: is_active,
        feeStatus: fee_status,
        feeAmount: feeAmountNumber,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Payment method created successfully" }, 201);
};
exports.createPaymentMethod = createPaymentMethod;
const updatePaymentMethod = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment Method ID is required");
    }
    const { name, description, logo, is_active, fee_status, fee_amount } = req.body;
    const existingPaymentMethod = await db_1.db.query.paymentMethod.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, id),
    });
    if (!existingPaymentMethod) {
        throw new BadRequest_1.BadRequest("Payment Method not found");
    }
    let feeAmountNumber;
    if (fee_status) {
        if (isNaN(fee_amount) || fee_amount < 0) {
            throw new BadRequest_1.BadRequest("Invalid fee amount");
        }
        else {
            feeAmountNumber = Number(fee_amount);
        }
    }
    else {
        feeAmountNumber = existingPaymentMethod.feeAmount;
    }
    await db_1.db.update(schema_1.paymentMethod).set({
        name: name || existingPaymentMethod.name,
        description: description || existingPaymentMethod.description,
        logo: logo || existingPaymentMethod.logo,
        isActive: is_active || existingPaymentMethod.isActive,
        feeStatus: fee_status || existingPaymentMethod.feeStatus,
        feeAmount: fee_status || existingPaymentMethod.feeAmount,
    }).where((0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Payment method updated successfully" }, 200);
};
exports.updatePaymentMethod = updatePaymentMethod;
const deletePaymentMethod = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Payment Method ID is required");
    }
    const existingPaymentMethod = await db_1.db.query.paymentMethod.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, id),
    });
    if (!existingPaymentMethod) {
        throw new BadRequest_1.BadRequest("Payment Method not found");
    }
    await db_1.db.delete(schema_1.paymentMethod).where((0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Payment method deleted successfully" }, 200);
};
exports.deletePaymentMethod = deletePaymentMethod;
