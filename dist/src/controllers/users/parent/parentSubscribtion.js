"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentSubscriptionById = exports.getParentSubscriptions = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const getParentSubscriptions = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    // const parentSubscription = await db.query.parentSubscriptions.findMany({
    //     where: eq(parentSubscriptions.parentId, user),
    // });
    const parentSubscription = await db_1.db.select({
        id: schema_1.parentSubscriptions.id,
        parentId: schema_1.parentSubscriptions.parentId,
        planId: schema_1.parentSubscriptions.parentPlanId,
        paymentId: schema_1.parentSubscriptions.parentPaymentId,
        isActive: schema_1.parentSubscriptions.isActive,
        startDate: schema_1.parentSubscriptions.startDate,
        endDate: schema_1.parentSubscriptions.endDate,
        createdAt: schema_1.parentSubscriptions.createdAt,
        updatedAt: schema_1.parentSubscriptions.updatedAt,
        plan: {
            id: schema_1.parentPlans.id,
            name: schema_1.parentPlans.name,
            price: schema_1.parentPlans.price
        }
    }).from(schema_1.parentSubscriptions)
        .leftJoin(schema_1.parentPlans, (0, drizzle_orm_1.eq)(schema_1.parentSubscriptions.parentPlanId, schema_1.parentPlans.id))
        .where((0, drizzle_orm_1.eq)(schema_1.parentSubscriptions.parentId, user));
    return (0, response_1.SuccessResponse)(res, { message: "Parent Subscriptions Fetched Successfully", parentSubscription }, 200);
};
exports.getParentSubscriptions = getParentSubscriptions;
const getParentSubscriptionById = async (req, res) => {
    const { id } = req.params;
    const user = req.user?.id;
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    if (!id) {
        throw new NotFound_1.NotFound("Please provide Subscription Id");
    }
    const parentSubscription = await db_1.db.query.parentSubscriptions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentSubscriptions.id, id),
    });
    return (0, response_1.SuccessResponse)(res, { message: "Parent Subscription Fetched Successfully", parentSubscription }, 200);
};
exports.getParentSubscriptionById = getParentSubscriptionById;
