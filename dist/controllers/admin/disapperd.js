import { db } from "../../models/db";
import { eq } from "drizzle-orm";
import { disappered } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
export const updatedisappered = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    // أضف validation
    if (!id) {
        return res.status(400).json({ error: "ID is required" });
    }
    if (typeof status !== "boolean") {
        return res.status(400).json({ error: "Status must be a boolean" });
    }
    const update = await db
        .update(disappered)
        .set({ status })
        .where(eq(disappered.id, id));
    SuccessResponse(res, { message: "Disappered Updated Successfully" }, 200);
};
//# sourceMappingURL=disapperd.js.map