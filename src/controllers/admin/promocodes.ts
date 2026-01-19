import { Request, Response } from "express";
import { db } from "../../models/db";
import { adminUsedPromocodes } from "../../models/admin/adminUsedPromocodes";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { promocode } from "../../models/schema";

type Promocode = typeof promocode.$inferSelect;

export const verifyPromocodeAvailable = async (code: string, organizationId: any): Promise<Promocode> => {

    const promocodeResult = await db
        .select()
        .from(promocode)
        .where(eq(promocode.code, code))
        .limit(1);

    if (!promocodeResult[0]) {
        throw new NotFound("Promocode not found");
    } else if (promocodeResult[0].isActive === false) {
        throw new BadRequest("Promocode is not active");
    }

    const usedPromocodeResult = await db.select().from(adminUsedPromocodes)
        .where(and(eq(adminUsedPromocodes.promocodeId, promocodeResult[0].id), eq(adminUsedPromocodes.organizationId, organizationId)))
        .limit(1);

    if (usedPromocodeResult[0]) {
        throw new BadRequest("Promocode already used by this Organization");
    }
    return promocodeResult[0];
};

export const verifyPromocode = async (req: Request, res: Response) => {
    const { code } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const promocodeResult = await verifyPromocodeAvailable(code, organizationId);

    if (!promocodeResult) {
        throw new BadRequest("Promocode is not available");
    }

    return SuccessResponse(res, { message: "Promocode Available", promocode: promocodeResult }, 200);
};