"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParentPlan = exports.createParentPlan = exports.deleteParentPlanById = exports.getParentPlanbyId = exports.getAllParentPlans = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const getAllParentPlans = async (req, res) => {
    const allParentPlans = await db_1.db.query.parentPlans.findMany();
    return (0, response_1.SuccessResponse)(res, { message: "Parent Plans Fetched Successfully", parentPlans: allParentPlans }, 200);
};
exports.getAllParentPlans = getAllParentPlans;
const getParentPlanbyId = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please Enter Parent Plan Id");
    }
    const parentPlan = await db_1.db.query.parentPlans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPlans.id, id)
    });
    if (!parentPlan) {
        throw new Errors_1.NotFound("Parent Plan not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Parent Plan Fetched Successfully", parentPlan }, 200);
};
exports.getParentPlanbyId = getParentPlanbyId;
const deleteParentPlanById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please Enter Parent Plan Id");
    }
    const parentPlan = await db_1.db.query.parentPlans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPlans.id, id)
    });
    if (!parentPlan) {
        throw new Errors_1.NotFound("Parent Plan not found");
    }
    await db_1.db.delete(schema_1.parentPlans).where((0, drizzle_orm_1.eq)(schema_1.parentPlans.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Parent Plan Deleted Successfully" }, 200);
};
exports.deleteParentPlanById = deleteParentPlanById;
const createParentPlan = async (req, res) => {
    const { name, price, startDate, endDate, minSubscriptionfeesPay, subscriptionFees } = req.body;
    if (!name || !subscriptionFees || !minSubscriptionfeesPay) {
        throw new BadRequest_1.BadRequest("Please provide all required fields: name, subscriptionFees , minSubscriptionfeesPay");
    }
    await db_1.db.insert(schema_1.parentPlans).values({
        name,
        price,
        minSubscriptionFeesPay: minSubscriptionfeesPay || 0,
        subscriptionFees
    });
    return (0, response_1.SuccessResponse)(res, { message: "Parent Plan Created Successfully" }, 201);
};
exports.createParentPlan = createParentPlan;
const updateParentPlan = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please Enter Parent Plan Id");
    }
    const { name, price, minSubscriptionfeesPay, subscriptionFees } = req.body;
    const parentPlan = await db_1.db.query.parentPlans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPlans.id, id)
    });
    if (!parentPlan) {
        throw new Errors_1.NotFound("Parent Plan not found");
    }
    await db_1.db.update(schema_1.parentPlans).set({
        name: name !== undefined ? name : parentPlan.name,
        price: price !== undefined ? price : parentPlan.price,
        minSubscriptionFeesPay: minSubscriptionfeesPay !== undefined ? minSubscriptionfeesPay : parentPlan.minSubscriptionFeesPay,
        subscriptionFees: subscriptionFees !== undefined ? subscriptionFees : parentPlan.subscriptionFees,
    }).where((0, drizzle_orm_1.eq)(schema_1.parentPlans.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Parent Plan Updated Successfully" }, 200);
};
exports.updateParentPlan = updateParentPlan;
