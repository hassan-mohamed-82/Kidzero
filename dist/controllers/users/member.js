import { db } from "../../models/db";
import { members } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors";
export const getAllMembers = async (req, res) => {
    const allMembers = await db.select().from(members);
    SuccessResponse(res, { members: allMembers }, 200);
};
export const getMember = async (req, res) => {
    const id = req.params.id;
    const [member] = await db.select().from(members).where(eq(members.id, id));
    if (!member)
        throw new NotFound("Member not found");
    SuccessResponse(res, { member }, 200);
};
//# sourceMappingURL=member.js.map