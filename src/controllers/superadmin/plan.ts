import { Request, Response } from "express";
import { db } from "../../models/db";
import { plans } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";
import { NotFound } from "../../Errors";

export const getAllPlans = async (req: Request, res: Response) => {
    const allPlans = await db.query.plans.findMany();
    return SuccessResponse(res, { message: "Plans Fetched Successfully", plans: allPlans }, 200);
};

export const getPlanbyId = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new BadRequest("Please Enter Plan Id");
    }

    // ✅ Id هو string (UUID) - لا تحوله لـ number
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, id)
    });

    if (!plan) {
        throw new NotFound("Plan not found");
    }
    return SuccessResponse(res, { message: "Plan Fetched Successfully", plan }, 200);
};

export const deletePlanById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new BadRequest("Please Enter Plan Id");
    }

    // ✅ استخدم Id مباشرة كـ string
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, id)
    });

    if (!plan) {
        throw new NotFound("Plan not found");
    }

    await db.delete(plans).where(eq(plans.id, id));
    return SuccessResponse(res, { message: "Plan Deleted Successfully" }, 200);
};

export const createPlan = async (req: Request, res: Response) => {
    const { name, price, startDate, endDate, max_buses, max_drivers, max_students , min_subscriptionfeesPay , subscriptionFees } = req.body;

    if (!name || !max_buses || !max_drivers || !max_students || !subscriptionFees || !min_subscriptionfeesPay) {
        throw new BadRequest("Please provide all required fields: name, max_buses, max_drivers, max_students, subscriptionFees , min_subscriptionfeesPay");
    }
    if (!startDate || !endDate) {
        throw new BadRequest("Please provide startDate and endDate");
    }
    if (new Date(startDate) >= new Date(endDate)) {
        throw new BadRequest("startDate must be earlier than endDate");
    }
    
    const newPlan = await db.insert(plans).values({
        name,
        price: price || 0,
        startDate,
        endDate,
        maxBuses: max_buses,
        maxDrivers: max_drivers,
        maxStudents: max_students,
        minSubscriptionFeesPay: min_subscriptionfeesPay || 0,
        subscriptionFees: subscriptionFees,
    });
    return SuccessResponse(res, { message: "Plan Created Successfully"}, 201);
};

export const updatePlan = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, price, startDate, endDate, max_buses, max_drivers, max_students , min_subscriptionfeesPay , subscriptionFees } = req.body;

    if (!id) {
        throw new BadRequest("Please Enter Plan Id");
    }

    // ✅ استخدم Id مباشرة كـ string
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, id)
    });

    if (!plan) {
        throw new NotFound("Plan not found");
    }

    const updatedPlan = await db.update(plans).set({
        name: name || plan.name,
        price: price !== undefined ? price : plan.price,
        startDate: startDate !== undefined ? startDate : plan.startDate,
        endDate: endDate !== undefined ? endDate : plan.endDate,
        maxBuses: max_buses !== undefined ? max_buses : plan.maxBuses,
        maxDrivers: max_drivers !== undefined ? max_drivers : plan.maxDrivers,
        maxStudents: max_students !== undefined ? max_students : plan.maxStudents,
        minSubscriptionFeesPay: min_subscriptionfeesPay !== undefined ? min_subscriptionfeesPay : plan.minSubscriptionFeesPay,
        subscriptionFees: subscriptionFees !== undefined ? subscriptionFees : plan.subscriptionFees,
    }).where(eq(plans.id, id));

    return SuccessResponse(res, { message: "Plan Updated Successfully"}, 200);
};
