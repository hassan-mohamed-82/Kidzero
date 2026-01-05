import { db } from "../../models/db";
import { plans } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";
import { NotFound } from "../../Errors";
export const getAllPlans = async (req, res) => {
    const allPlans = await db.query.plans.findMany();
    return SuccessResponse(res, { message: "Plans Fetched Successfully", plans: allPlans }, 200);
};
export const getPlanbyId = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Plan Id");
    }
    // ✅ Id هو string (UUID) - لا تحوله لـ number
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, Id)
    });
    if (!plan) {
        throw new NotFound("Plan not found");
    }
    return SuccessResponse(res, { message: "Plan Fetched Successfully", plan }, 200);
};
export const deletePlanById = async (req, res) => {
    const { Id } = req.params;
    if (!Id) {
        throw new BadRequest("Please Enter Plan Id");
    }
    // ✅ استخدم Id مباشرة كـ string
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, Id)
    });
    if (!plan) {
        throw new NotFound("Plan not found");
    }
    await db.delete(plans).where(eq(plans.id, Id));
    return SuccessResponse(res, { message: "Plan Deleted Successfully" }, 200);
};
export const createPlan = async (req, res) => {
    const { name, price_semester, price_year, max_buses, max_drivers, max_students } = req.body;
    if (!name || !max_buses || !max_drivers || !max_students) {
        throw new BadRequest("Please provide all required fields: name, max_buses, max_drivers, max_students");
    }
    const newPlan = await db.insert(plans).values({
        name,
        price_semester: price_semester || 0,
        price_year: price_year || 0,
        maxBuses: max_buses,
        maxDrivers: max_drivers,
        maxStudents: max_students
    });
    return SuccessResponse(res, { message: "Plan Created Successfully" }, 201);
};
export const updatePlan = async (req, res) => {
    const { Id } = req.params;
    const { name, price_semester, price_year, max_buses, max_drivers, max_students } = req.body;
    if (!Id) {
        throw new BadRequest("Please Enter Plan Id");
    }
    // ✅ استخدم Id مباشرة كـ string
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, Id)
    });
    if (!plan) {
        throw new NotFound("Plan not found");
    }
    const updatedPlan = await db.update(plans).set({
        name: name || plan.name,
        price_semester: price_semester !== undefined ? price_semester : plan.price_semester,
        price_year: price_year !== undefined ? price_year : plan.price_year,
        maxBuses: max_buses !== undefined ? max_buses : plan.maxBuses,
        maxDrivers: max_drivers !== undefined ? max_drivers : plan.maxDrivers,
        maxStudents: max_students !== undefined ? max_students : plan.maxStudents,
    }).where(eq(plans.id, Id));
    return SuccessResponse(res, { message: "Plan Updated Successfully" }, 200);
};
//# sourceMappingURL=plan.js.map