"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPromocode = exports.verifyPromocodeAvailable = void 0;
const db_1 = require("../../models/db");
const adminUsedPromocodes_1 = require("../../models/admin/adminUsedPromocodes");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const schema_1 = require("../../models/schema");
const verifyPromocodeAvailable = async (code) => {
    const promocodeResult = await db_1.db
        .select()
        .from(schema_1.promocode)
        .where((0, drizzle_orm_1.eq)(schema_1.promocode.code, code))
        .limit(1);
    if (!promocodeResult[0]) {
        throw new NotFound_1.NotFound("Promocode not found");
    }
    else if (promocodeResult[0].isActive === false) {
        throw new BadRequest_1.BadRequest("Promocode is not active");
    }
    const usedPromocodeResult = await db_1.db.select().from(adminUsedPromocodes_1.adminUsedPromocodes)
        .where((0, drizzle_orm_1.eq)(adminUsedPromocodes_1.adminUsedPromocodes.promocodeId, promocodeResult[0].id))
        .limit(1);
    if (usedPromocodeResult[0]) {
        throw new BadRequest_1.BadRequest("Promocode already used");
    }
    return promocodeResult[0];
};
exports.verifyPromocodeAvailable = verifyPromocodeAvailable;
const verifyPromocode = async (req, res) => {
    const { code } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const promocodeResult = await (0, exports.verifyPromocodeAvailable)(code);
    if (!promocodeResult) {
        throw new BadRequest_1.BadRequest("Promocode is not available");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Promocode Available", promocode: promocodeResult }, 200);
};
exports.verifyPromocode = verifyPromocode;
