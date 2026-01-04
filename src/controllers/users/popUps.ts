import { Request, Response } from "express";
import { db } from "../../models/db";
import { appPages, popUpsImages, popUpsPages } from "../../models/schema";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors";

export const getActivePopUpsForPage = async (req: Request, res: Response) => {
  const pageName = req.params.pageId;
  const [page] = await db
    .select()
    .from(appPages)
    .where(eq(appPages.name, pageName));
  if (!page) throw new NotFound("Page not found");
  const results = await db
    .select()
    .from(popUpsImages)
    .where(
      and(eq(popUpsPages.pageId, page.id), eq(popUpsImages.status, "active"))
    );

  SuccessResponse(res, { popups: results }, 200);
};
