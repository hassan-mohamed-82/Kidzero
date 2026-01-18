"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlan = exports.createPlan = exports.deletePlanById = exports.getPlanbyId = exports.getAllPlans = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const getAllPlans = async (req, res) => {
    const allPlans = await db_1.db.query.plans.findMany();
    return (0, response_1.SuccessResponse)(res, { message: "Plans Fetched Successfully", plans: allPlans }, 200);
};
exports.getAllPlans = getAllPlans;
const getPlanbyId = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please Enter Plan Id");
    }
    // ✅ Id هو string (UUID) - لا تحوله لـ number
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, id)
    });
    if (!plan) {
        throw new Errors_1.NotFound("Plan not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Plan Fetched Successfully", plan }, 200);
};
exports.getPlanbyId = getPlanbyId;
const deletePlanById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please Enter Plan Id");
    }
    // ✅ استخدم Id مباشرة كـ string
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, id)
    });
    if (!plan) {
        throw new Errors_1.NotFound("Plan not found");
    }
    await db_1.db.delete(schema_1.plans).where((0, drizzle_orm_1.eq)(schema_1.plans.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Plan Deleted Successfully" }, 200);
};
exports.deletePlanById = deletePlanById;
const createPlan = async (req, res) => {
    const { name, price, max_buses, max_drivers, max_students, min_subscriptionfeesPay, subscriptionFees } = req.body;
    if (!name || !max_buses || !max_drivers || !max_students || !subscriptionFees || !min_subscriptionfeesPay) {
        throw new BadRequest_1.BadRequest("Please provide all required fields: name, max_buses, max_drivers, max_students, subscriptionFees , min_subscriptionfeesPay");
    }
    const newPlan = await db_1.db.insert(schema_1.plans).values({
        name,
        price: price || 0,
        maxBuses: max_buses,
        maxDrivers: max_drivers,
        maxStudents: max_students,
        minSubscriptionFeesPay: min_subscriptionfeesPay || 0,
        subscriptionFees: subscriptionFees,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Plan Created Successfully" }, 201);
};
exports.createPlan = createPlan;
const updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, price, max_buses, max_drivers, max_students, min_subscriptionfeesPay, subscriptionFees } = req.body;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please Enter Plan Id");
    }
    // ✅ استخدم Id مباشرة كـ string
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, id)
    });
    if (!plan) {
        throw new Errors_1.NotFound("Plan not found");
    }
    await db_1.db.update(schema_1.plans).set({
        name: name || plan.name,
        price: price !== undefined ? price : plan.price,
        maxBuses: max_buses !== undefined ? max_buses : plan.maxBuses,
        maxDrivers: max_drivers !== undefined ? max_drivers : plan.maxDrivers,
        maxStudents: max_students !== undefined ? max_students : plan.maxStudents,
        minSubscriptionFeesPay: min_subscriptionfeesPay !== undefined ? min_subscriptionfeesPay : plan.minSubscriptionFeesPay,
        subscriptionFees: subscriptionFees !== undefined ? subscriptionFees : plan.subscriptionFees,
    }).where((0, drizzle_orm_1.eq)(schema_1.plans.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Plan Updated Successfully" }, 200);
};
exports.updatePlan = updatePlan;
