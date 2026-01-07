// src/controllers/admin/subscriptionController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { subscriptions, plans, payment } from "../../models/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
// ✅ Get My Subscriptions (Active & Inactive)
export const getMySubscriptions = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const now = new Date();

  const allSubscriptions = await db
    .select({
      id: subscriptions.id,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      isActive: subscriptions.isActive,
      createdAt: subscriptions.createdAt,
      plan: {
        id: plans.id,
        name: plans.name,
        priceSemester: plans.price_semester,
        priceYear: plans.price_year,
        maxBuses: plans.maxBuses,
        maxDrivers: plans.maxDrivers,
        maxStudents: plans.maxStudents,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
      },
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
    .where(eq(subscriptions.organizationId, organizationId))
    .orderBy(desc(subscriptions.startDate));

  const active = allSubscriptions.filter(
    (sub) => sub.isActive && new Date(sub.endDate) >= now
  );

  const inactive = allSubscriptions.filter(
    (sub) => !sub.isActive || new Date(sub.endDate) < now
  );

  const activeWithInfo = active.map((sub) => {
    const daysRemaining = Math.ceil(
      (new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...sub,
      daysRemaining,
      isExpiringSoon: daysRemaining <= 7,
    };
  });

  SuccessResponse(
    res,
    {
      active: activeWithInfo,
      inactive: inactive,
      summary: {
        totalActive: active.length,
        totalInactive: inactive.length,
        total: allSubscriptions.length,
      },
    },
    200
  );
};



// ✅ Get Subscription By ID
export const getSubscriptionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const [subscription] = await db
    .select({
      id: subscriptions.id,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      isActive: subscriptions.isActive,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,
      plan: {
        id: plans.id,
        name: plans.name,
        priceSemester: plans.price_semester,
        priceYear: plans.price_year,
        maxBuses: plans.maxBuses,
        maxDrivers: plans.maxDrivers,
        maxStudents: plans.maxStudents,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
      },
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!subscription) {
    throw new NotFound("Subscription not found");
  }

  SuccessResponse(res, { subscription }, 200);
};