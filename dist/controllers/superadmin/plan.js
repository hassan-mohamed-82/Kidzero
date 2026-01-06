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
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Plan Id");
    }
    // ✅ Id هو string (UUID) - لا تحوله لـ number
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, Id)
    });
    if (!plan) {
        throw new Errors_1.NotFound("Plan not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Plan Fetched Successfully", plan }, 200);
};
exports.getPlanbyId = getPlanbyId;
const deletePlanById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Plan Id");
    }
    // ✅ استخدم Id مباشرة كـ string
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, Id)
    });
    if (!plan) {
        throw new Errors_1.NotFound("Plan not found");
    }
    await db_1.db.delete(schema_1.plans).where((0, drizzle_orm_1.eq)(schema_1.plans.id, Id));
    return (0, response_1.SuccessResponse)(res, { message: "Plan Deleted Successfully" }, 200);
};
exports.deletePlanById = deletePlanById;
const createPlan = async (req, res) => {
    const { name, price_semester, price_year, max_buses, max_drivers, max_students } = req.body;
    if (!name || !max_buses || !max_drivers || !max_students) {
        throw new BadRequest_1.BadRequest("Please provide all required fields: name, max_buses, max_drivers, max_students");
    }
    const newPlan = await db_1.db.insert(schema_1.plans).values({
        name,
        price_semester: price_semester || 0,
        price_year: price_year || 0,
        maxBuses: max_buses,
        maxDrivers: max_drivers,
        maxStudents: max_students
    });
    return (0, response_1.SuccessResponse)(res, { message: "Plan Created Successfully" }, 201);
};
exports.createPlan = createPlan;
const updatePlan = async (req, res) => {
    const { Id } = req.params;
    const { name, price_semester, price_year, max_buses, max_drivers, max_students } = req.body;
    if (!Id) {
        throw new BadRequest_1.BadRequest("Please Enter Plan Id");
    }
    // ✅ استخدم Id مباشرة كـ string
    const plan = await db_1.db.query.plans.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.plans.id, Id)
    });
    if (!plan) {
        throw new Errors_1.NotFound("Plan not found");
    }
    const updatedPlan = await db_1.db.update(schema_1.plans).set({
        name: name || plan.name,
        price_semester: price_semester !== undefined ? price_semester : plan.price_semester,
        price_year: price_year !== undefined ? price_year : plan.price_year,
        maxBuses: max_buses !== undefined ? max_buses : plan.maxBuses,
        maxDrivers: max_drivers !== undefined ? max_drivers : plan.maxDrivers,
        maxStudents: max_students !== undefined ? max_students : plan.maxStudents,
    }).where((0, drizzle_orm_1.eq)(schema_1.plans.id, Id));
    return (0, response_1.SuccessResponse)(res, { message: "Plan Updated Successfully" }, 200);
};
exports.updatePlan = updatePlan;
