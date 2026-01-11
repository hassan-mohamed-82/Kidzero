import { Request, Response } from 'express';
import { db } from '../../../models/db';
import { rides } from '../../../models/schema';
import { eq } from 'drizzle-orm';
import { SuccessResponse } from '../../../utils/response';
import { BadRequest } from '../../../Errors/BadRequest';
import { drivers } from '../../../models/schema';
export const getAllRides = async (req: Request, res: Response) => {
    const driverId = req.user?.id;
    if (!driverId) {
        throw new BadRequest("Invalid driver id");
    }
    const driver = await db.query.drivers.findFirst({
        where: eq(drivers.id, driverId)
    });
    if (!driver) {
        throw new BadRequest("Invalid driver id");
    }

    const DriverRides = await db.select().from(rides).where(eq(rides.driverId, driverId));
    SuccessResponse(res, { DriverRides }, 200);
};

