import { Request , Response } from "express";
import { db } from "../../models/db";
import { plans } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";
import { NotFound } from "../../Errors";

export const getAllPlans = async(req: Request , res: Response)=> {
    const plans = await db.query.plans.findMany();
    return SuccessResponse(res , {message: "Plans Fetched Successfully" , plans}, 200);
};

export const getPlanbyId = async (req: Request, res: Response) => {
    const { Id } = req.params;
    
    if (!Id) {
        throw new BadRequest("Please Enter Plan Id");
    }
    
    const planId = parseInt(Id, 10);
    
    if (isNaN(planId)) {
        throw new BadRequest("Plan Id must be a valid number");
    }
    
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, planId)
    });
    
    if (!plan) {
        throw new NotFound("Plan not found");
    }
    
    return res.status(200).json(plan);
};
