"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePromoCodeById = exports.deletePromoCodeById = exports.getPromocodeById = exports.getAllPromoCodes = exports.createPromoCode = void 0;
const BadRequest_1 = require("../../Errors/BadRequest");
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const createPromoCode = async (req, res) => {
    const { name, code, promocode_type, amount, description, start_date, end_date } = req.body;
    if (!name || !code || !promocode_type || !amount || !description || !start_date || !end_date) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    if (!["percentage", "amount"].includes(promocode_type)) {
        throw new BadRequest_1.BadRequest("Invalid promocode type");
    }
    if (isNaN(amount) || amount <= 0) {
        throw new BadRequest_1.BadRequest("Amount must be a positive number");
    }
    if (startDateObj >= endDateObj) {
        throw new BadRequest_1.BadRequest("Start date must be before end date");
    }
    const ExistingPromoCode = await db_1.db.query.promocode.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.promocode.code, code)
    });
    if (ExistingPromoCode) {
        throw new BadRequest_1.BadRequest("Promo code already exists");
    }
    const newPromoCode = await db_1.db.insert(schema_1.promocode).values({
        name,
        code,
        promocodeType: promocode_type,
        amount: Number(amount),
        description,
        startDate: startDateObj,
        endDate: endDateObj
    });
    return (0, response_1.SuccessResponse)(res, { message: "Promo code created successfully" }, 201);
};
exports.createPromoCode = createPromoCode;
const getAllPromoCodes = async (req, res) => {
    const promoCodes = await db_1.db.query.promocode.findMany();
    return (0, response_1.SuccessResponse)(res, { promoCodes }, 200);
};
exports.getAllPromoCodes = getAllPromoCodes;
const getPromocodeById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Promo Code Id");
    }
    const promoCode = await db_1.db.query.promocode.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.promocode.id, Id)
    });
    if (!promoCode) {
        throw new BadRequest_1.BadRequest("Promo code not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Promo code retrieved successfully", promoCode }, 200);
};
exports.getPromocodeById = getPromocodeById;
const deletePromoCodeById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Promo Code Id");
    }
    const promoCode = await db_1.db.query.promocode.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.promocode.id, Id)
    });
    if (!promoCode) {
        throw new BadRequest_1.BadRequest("Promo code not found");
    }
    await db_1.db.delete(schema_1.promocode).where((0, drizzle_orm_1.eq)(schema_1.promocode.id, Id));
    return (0, response_1.SuccessResponse)(res, { message: "Promo code deleted successfully" }, 200);
};
exports.deletePromoCodeById = deletePromoCodeById;
const updatePromoCodeById = async (req, res) => {
    const { Id } = req.params;
    const { name, code, promocode_type, amount, description, start_date, end_date } = req.body;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Promo Code Id");
    }
    const promoCode = await db_1.db.query.promocode.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.promocode.id, Id)
    });
    if (!promoCode) {
        throw new BadRequest_1.BadRequest("Promo code not found");
    }
    await db_1.db.update(schema_1.promocode).set({
        name: name || promoCode.name,
        promocodeType: promocode_type || promoCode.promocodeType,
        amount: amount !== undefined ? Number(amount) : promoCode.amount,
        description: description || promoCode.description,
        startDate: start_date ? new Date(start_date) : promoCode.startDate,
        endDate: end_date ? new Date(end_date) : promoCode.endDate,
    }).where((0, drizzle_orm_1.eq)(schema_1.promocode.id, Id));
    return (0, response_1.SuccessResponse)(res, { message: "Promo code updated successfully" }, 200);
};
exports.updatePromoCodeById = updatePromoCodeById;
