"use strict";
// src/controllers/admin/subscriptionController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionById = exports.getMySubscriptions = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
// ✅ Get My Subscriptions (Active & Inactive)
const getMySubscriptions = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const now = new Date();
    const allSubscriptions = await db_1.db
        .select({
        id: schema_1.subscriptions.id,
        startDate: schema_1.subscriptions.startDate,
        endDate: schema_1.subscriptions.endDate,
        isActive: schema_1.subscriptions.isActive,
        createdAt: schema_1.subscriptions.createdAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            priceSemester: schema_1.plans.price_semester,
            priceYear: schema_1.plans.price_year,
            maxBuses: schema_1.plans.maxBuses,
            maxDrivers: schema_1.plans.maxDrivers,
            maxStudents: schema_1.plans.maxStudents,
        },
        payment: {
            id: schema_1.payment.id,
            amount: schema_1.payment.amount,
            status: schema_1.payment.status,
        },
    })
        .from(schema_1.subscriptions)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.subscriptions.planId, schema_1.plans.id))
        .leftJoin(schema_1.payment, (0, drizzle_orm_1.eq)(schema_1.subscriptions.paymentId, schema_1.payment.id))
        .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, organizationId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.subscriptions.startDate));
    const active = allSubscriptions.filter((sub) => sub.isActive && new Date(sub.endDate) >= now);
    const inactive = allSubscriptions.filter((sub) => !sub.isActive || new Date(sub.endDate) < now);
    const activeWithInfo = active.map((sub) => {
        const daysRemaining = Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
            ...sub,
            daysRemaining,
            isExpiringSoon: daysRemaining <= 7,
        };
    });
    (0, response_1.SuccessResponse)(res, {
        active: activeWithInfo,
        inactive: inactive,
        summary: {
            totalActive: active.length,
            totalInactive: inactive.length,
            total: allSubscriptions.length,
        },
    }, 200);
};
exports.getMySubscriptions = getMySubscriptions;
// ✅ Get Subscription By ID
const getSubscriptionById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const [subscription] = await db_1.db
        .select({
        id: schema_1.subscriptions.id,
        startDate: schema_1.subscriptions.startDate,
        endDate: schema_1.subscriptions.endDate,
        isActive: schema_1.subscriptions.isActive,
        createdAt: schema_1.subscriptions.createdAt,
        updatedAt: schema_1.subscriptions.updatedAt,
        plan: {
            id: schema_1.plans.id,
            name: schema_1.plans.name,
            priceSemester: schema_1.plans.price_semester,
            priceYear: schema_1.plans.price_year,
            maxBuses: schema_1.plans.maxBuses,
            maxDrivers: schema_1.plans.maxDrivers,
            maxStudents: schema_1.plans.maxStudents,
        },
        payment: {
            id: schema_1.payment.id,
            amount: schema_1.payment.amount,
            status: schema_1.payment.status,
        },
    })
        .from(schema_1.subscriptions)
        .leftJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.subscriptions.planId, schema_1.plans.id))
        .leftJoin(schema_1.payment, (0, drizzle_orm_1.eq)(schema_1.subscriptions.paymentId, schema_1.payment.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, id), (0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, organizationId)))
        .limit(1);
    if (!subscription) {
        throw new NotFound_1.NotFound("Subscription not found");
    }
    (0, response_1.SuccessResponse)(res, { subscription }, 200);
};
exports.getSubscriptionById = getSubscriptionById;
