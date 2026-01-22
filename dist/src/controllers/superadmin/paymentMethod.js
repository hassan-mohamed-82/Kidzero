"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.getPaymentMethodById = exports.getAllPaymentMethods = void 0;
const db_1 = require("../../models/db");
const response_1 = require("../../utils/response");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
const validateAndSaveLogo = async (req, logo) => {
    if (!logo.match(BASE64_IMAGE_REGEX)) {
        throw new BadRequest_1.BadRequest("Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)");
    }
    try {
        const logoData = await (0, handleImages_1.saveBase64Image)(req, logo, 'paymentMethods');
        return logoData.url;
    }
    catch (error) {
        throw new BadRequest_1.BadRequest(`Failed to save logo: ${error.message}`);
    }
};
const getAllPaymentMethods = async (req, res) => {
    // const paymentMethods = await db.query.paymentMethod.findMany();
    const paymentMethods = await db_1.db.select().from(schema_1.paymentMethod).where((0, drizzle_orm_1.eq)(schema_1.paymentMethod.isActive, true));
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
    const logoUrl = await validateAndSaveLogo(req, logo);
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
    await db_1.db.insert(schema_1.paymentMethod).values({
        name,
        description,
        logo: logoUrl,
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
    const logoUrl = await validateAndSaveLogo(req, logo);
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
        logo: logoUrl || existingPaymentMethod.logo,
        isActive: is_active ?? existingPaymentMethod.isActive,
        feeStatus: fee_status ?? existingPaymentMethod.feeStatus,
        feeAmount: fee_amount ?? existingPaymentMethod.feeAmount,
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
