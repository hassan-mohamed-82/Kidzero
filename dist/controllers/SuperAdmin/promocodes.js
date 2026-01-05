import { BadRequest } from "../../Errors/BadRequest";
import { db } from "../../models/db";
import { eq } from "drizzle-orm";
import { promocode } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
export const createPromoCode = async (req, res) => {
    const { name, code, promocode_type, amount, description, start_date, end_date } = req.body;
    if (!name || !code || !promocode_type || !amount || !description || !start_date || !end_date) {
        throw new BadRequest("Missing required fields");
    }
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    if (!["percentage", "amount"].includes(promocode_type)) {
        throw new BadRequest("Invalid promocode type");
    }
    if (isNaN(amount) || amount <= 0) {
        throw new BadRequest("Amount must be a positive number");
    }
    if (startDateObj >= endDateObj) {
        throw new BadRequest("Start date must be before end date");
    }
    const ExistingPromoCode = await db.query.promocode.findFirst({
        where: eq(promocode.code, code)
    });
    if (ExistingPromoCode) {
        throw new BadRequest("Promo code already exists");
    }
    const newPromoCode = await db.insert(promocode).values({
        name,
        code,
        promocodeType: promocode_type,
        amount: Number(amount),
        description,
        startDate: startDateObj,
        endDate: endDateObj
    });
    return SuccessResponse(res, { message: "Promo code created successfully" }, 201);
};
export const getAllPromoCodes = async (req, res) => {
    const promoCodes = await db.query.promocode.findMany();
    return SuccessResponse(res, { promoCodes }, 200);
};
export const getPromocodeById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Promo Code Id");
    }
    const promoCode = await db.query.promocode.findFirst({
        where: eq(promocode.id, Id)
    });
    if (!promoCode) {
        throw new BadRequest("Promo code not found");
    }
    return SuccessResponse(res, { message: "Promo code retrieved successfully", promoCode }, 200);
};
export const deletePromoCodeById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Promo Code Id");
    }
    const promoCode = await db.query.promocode.findFirst({
        where: eq(promocode.id, Id)
    });
    if (!promoCode) {
        throw new BadRequest("Promo code not found");
    }
    await db.delete(promocode).where(eq(promocode.id, Id));
    return SuccessResponse(res, { message: "Promo code deleted successfully" }, 200);
};
export const updatePromoCodeById = async (req, res) => {
    const { Id } = req.params;
    const { name, code, promocode_type, amount, description, start_date, end_date } = req.body;
    if (!Id) {
        throw new BadRequest("Please Enter Promo Code Id");
    }
    const promoCode = await db.query.promocode.findFirst({
        where: eq(promocode.id, Id)
    });
    if (!promoCode) {
        throw new BadRequest("Promo code not found");
    }
    const updateData = {};
    if (name)
        updateData.name = name;
    if (code)
        updateData.code = code;
    if (promocode_type) {
        if (!["percentage", "amount"].includes(promocode_type)) {
            throw new BadRequest("Invalid promocode type");
        }
        updateData.promocodeType = promocode_type;
    }
    if (amount) {
        if (isNaN(amount) || amount <= 0) {
            throw new BadRequest("Amount must be a positive number");
        }
        updateData.amount = Number(amount);
    }
    if (description)
        updateData.description = description;
    if (start_date) {
        const startDateObj = new Date(start_date);
        updateData.startDate = startDateObj;
    }
    if (end_date) {
        const endDateObj = new Date(end_date);
        updateData.endDate = endDateObj;
    }
    if (start_date && end_date) {
        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        if (startDateObj >= endDateObj) {
            throw new BadRequest("Start date must be before end date");
        }
    }
    await db.update(promocode).set(updateData).where(eq(promocode.id, Id));
    return SuccessResponse(res, { message: "Promo code updated successfully" }, 200);
};
//# sourceMappingURL=promocodes.js.map