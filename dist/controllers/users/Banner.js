import { db } from "../../models/db";
import { banners } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors";
export const getAllBanners = async (req, res) => {
    const allBanners = await db.select().from(banners);
    SuccessResponse(res, { banners: allBanners }, 200);
};
export const getBanner = async (req, res) => {
    const id = req.params.id;
    const [banner] = await db.select().from(banners).where(eq(banners.id, id));
    if (!banner)
        throw new NotFound("Banner not found");
    SuccessResponse(res, { banner }, 200);
};
//# sourceMappingURL=Banner.js.map