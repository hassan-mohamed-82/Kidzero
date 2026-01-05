import { Request , Response } from "express";
import { db } from "../../models/db";
import { plans } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";

export const getAllPlans = async(req: Request , res: Response)=> {
    const plans = await db.query.plans.findMany();
    return SuccessResponse(res , {message: "Plans Fetched Successfully" , plans}, 200);
};

export const getPlanbyId = async(req: Request , res: Response) => {
    const Id = req.params
    if(!Id){
        throw new BadRequest("Please Enter Plan Id");
    }
    const plan = await db.query.plans.findFirst({where: eq(plans.id, Id)});
};