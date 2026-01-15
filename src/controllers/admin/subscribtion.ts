// // src/controllers/admin/subscriptionController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { subscriptions, plans, payment, paymentMethod, organizations } from "../../models/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { saveBase64Image } from "../../utils/handleImages";

// ✅ Get My Subscriptions (Active & Inactive)
export const getMySubscriptions = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }
    const Org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
    });

    if (!Org) {
        throw new NotFound("Organization not found");
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
                price: plans.price,
                maxBuses: plans.maxBuses,
                maxDrivers: plans.maxDrivers,
                maxStudents: plans.maxStudents,
            },
            payment: {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                receiptImage: payment.receiptImage,
                rejectedReason: payment.rejectedReason,
            },
        })
        .from(subscriptions)
        .leftJoin(plans, eq(subscriptions.planId, plans.id))
        .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
        .where(eq(subscriptions.organizationId, organizationId))
        .orderBy(desc(subscriptions.createdAt));

    // Active: payment completed, isActive = true, not expired
    const active = allSubscriptions.filter(
        (sub) =>
            sub.payment?.status === "completed" &&
            sub.isActive &&
            new Date(sub.endDate) >= now
    );

    // Pending: payment status is pending
    const pending = allSubscriptions.filter(
        (sub) => sub.payment?.status === "pending"
    );

    // Rejected: payment status is rejected
    const rejected = allSubscriptions.filter(
        (sub) => sub.payment?.status === "rejected"
    );

    // Expired: payment completed but endDate < now
    const expired = allSubscriptions.filter(
        (sub) =>
            sub.payment?.status === "completed" && new Date(sub.endDate) < now
    );

    // // Cancelled: payment completed, isActive = false, not expired
    // const cancelled = allSubscriptions.filter(
    //   (sub) =>
    //     sub.payment?.status === "completed" &&
    //     !sub.isActive &&
    //     new Date(sub.endDate) >= now
    // );

    // Add daysRemaining for active subscriptions
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

    // Add daysUntilStart for pending subscriptions
    const pendingWithInfo = pending.map((sub) => {
        const daysUntilStart = Math.ceil(
            (new Date(sub.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
            ...sub,
            daysUntilStart: daysUntilStart > 0 ? daysUntilStart : 0,
        };
    });

    SuccessResponse(
        res,
        {
            subscriptionStatus: Org.status,
            active: activeWithInfo,
            pending: pendingWithInfo,
            rejected,
            expired,
            //cancelled,
            summary: {
                totalActive: active.length,
                totalPending: pending.length,
                totalRejected: rejected.length,
                totalExpired: expired.length,
                //totalCancelled: cancelled.length,
                total: allSubscriptions.length,
            },
        },
        200
    );
};

export const getSubscriptionById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const subscription = await db
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
                price: plans.price,

                maxBuses: plans.maxBuses,
                maxDrivers: plans.maxDrivers,
                maxStudents: plans.maxStudents,
            },
            payment: {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                receiptImage: payment.receiptImage,
                rejectedReason: payment.rejectedReason,
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

    if (!subscription || subscription.length === 0) {
        throw new NotFound("Subscription not found");
    }

    const sub = subscription[0];
    const now = new Date();
    const daysRemaining = Math.ceil(
        (new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    SuccessResponse(
        res,
        {
            subscription: {
                ...sub,
                daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
                isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
                isExpired: daysRemaining <= 0,
            },
        },
        200
    );
};

// ==================== SUBSCRIPTION ACTIONS ====================

/**
 * Subscribe to a new plan
 */
// export const subscribe = async (req: Request, res: Response) => {
//   const { planId, duration, paymentMethodId, receiptImage } = req.body;
//   const organizationId = req.user?.organizationId;

//   if (!organizationId) {
//     throw new BadRequest("Organization ID is required");
//   }

//   if (!planId || !duration || !paymentMethodId) {
//     throw new BadRequest("planId, duration, and paymentMethodId are required");
//   }

//   if (!["semester", "year"].includes(duration)) {
//     throw new BadRequest("Duration must be 'semester' or 'year'");
//   }

//   // Check for existing active subscription
//   const existingActive = await db
//     .select({ id: subscriptions.id })
//     .from(subscriptions)
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(
//       and(
//         eq(subscriptions.organizationId, organizationId),
//         eq(subscriptions.isActive, true),
//         eq(payment.status, "completed"),
//         gte(subscriptions.endDate, new Date())
//       )
//     )
//     .limit(1);

//   if (existingActive && existingActive.length > 0) {
//     throw new BadRequest(
//       "You already have an active subscription. Use renew or upgrade instead."
//     );
//   }

//   // Check for existing pending request
//   const existingPending = await db
//     .select({ id: subscriptions.id })
//     .from(subscriptions)
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(
//       and(
//         eq(subscriptions.organizationId, organizationId),
//         eq(payment.status, "pending")
//       )
//     )
//     .limit(1);

//   if (existingPending && existingPending.length > 0) {
//     throw new BadRequest(
//       "You already have a pending subscription request. Please wait for approval or cancel it first."
//     );
//   }

//   // Get plan details
//   const planResult = await db
//     .select()
//     .from(plans)
//     .where(eq(plans.id, planId))
//     .limit(1);

//   if (!planResult || planResult.length === 0) {
//     throw new NotFound("Plan not found");
//   }

//   const plan = planResult[0];

//   // Get payment method details
//   const payMethodResult = await db
//     .select()
//     .from(paymentMethod)
//     .where(
//       and(eq(paymentMethod.id, paymentMethodId), eq(paymentMethod.isActive, true))
//     )
//     .limit(1);

//   if (!payMethodResult || payMethodResult.length === 0) {
//     throw new NotFound("Payment method not found or inactive");
//   }

//   const payMethod = payMethodResult[0];

//   // Calculate amount
//   const baseAmount =
//     duration === "semester" ? plan.price_semester : plan.price_year;
//   const fee = payMethod.feeStatus ? payMethod.feeAmount : 0;
//   const totalAmount = baseAmount + fee;

//   // Calculate dates
//   const startDate = new Date();
//   const endDate = new Date();
//   const monthsToAdd = duration === "semester" ? 6 : 12;
//   endDate.setMonth(endDate.getMonth() + monthsToAdd);

//  // Save receipt image if provided
// let receiptImageUrl: string | null = null;
// if (receiptImage) {
//   const savedImage = await saveBase64Image(req, receiptImage, "payments/receipts");
//   receiptImageUrl = savedImage.url;
// }


//   // Create payment
//   const paymentId = uuidv4();
//   await db.execute(
//     sql`INSERT INTO payments (id, organization_id, plan_id, payment_method_id, amount, receipt_image, status)
//         VALUES (${paymentId}, ${organizationId}, ${planId}, ${paymentMethodId}, ${totalAmount}, ${receiptImageUrl}, 'pending')`
//   );

//   // Create subscription
//   const subscriptionId = uuidv4();
//   await db.execute(
//     sql`INSERT INTO subscriptions (id, plan_id, organization_id, start_date, end_date, payment_id, is_active)
//         VALUES (${subscriptionId}, ${planId}, ${organizationId}, ${startDate}, ${endDate}, ${paymentId}, false)`
//   );

//   // Fetch created subscription with details
//   const createdSubscription = await db
//     .select({
//       id: subscriptions.id,
//       startDate: subscriptions.startDate,
//       endDate: subscriptions.endDate,
//       isActive: subscriptions.isActive,
//       plan: {
//         id: plans.id,
//         name: plans.name,
//       },
//       payment: {
//         id: payment.id,
//         amount: payment.amount,
//         status: payment.status,
//         receiptImage: payment.receiptImage,
//       },
//     })
//     .from(subscriptions)
//     .leftJoin(plans, eq(subscriptions.planId, plans.id))
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(eq(subscriptions.id, subscriptionId))
//     .limit(1);

//   SuccessResponse(
//     res,
//     {
//       message: "Subscription request submitted. Waiting for admin approval.",
//       subscription: createdSubscription[0],
//       duration,
//       daysUntilStart: 0,
//     },
//     201
//   );
// };

// /**
//  * Renew current subscription
//  */
// export const renewSubscription = async (req: Request, res: Response) => {
//   const { duration, paymentMethodId, receiptImage } = req.body;
//   const organizationId = req.user?.organizationId;

//   if (!organizationId) {
//     throw new BadRequest("Organization ID is required");
//   }

//   if (!duration || !paymentMethodId) {
//     throw new BadRequest("duration and paymentMethodId are required");
//   }

//   if (!["semester", "year"].includes(duration)) {
//     throw new BadRequest("Duration must be 'semester' or 'year'");
//   }

//   // Get current active subscription
//   const activeSubscription = await db
//     .select({
//       id: subscriptions.id,
//       planId: subscriptions.planId,
//       endDate: subscriptions.endDate,
//     })
//     .from(subscriptions)
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(
//       and(
//         eq(subscriptions.organizationId, organizationId),
//         eq(subscriptions.isActive, true),
//         eq(payment.status, "completed"),
//         gte(subscriptions.endDate, new Date())
//       )
//     )
//     .limit(1);

//   if (!activeSubscription || activeSubscription.length === 0) {
//     throw new NotFound("No active subscription to renew");
//   }

//   const currentSub = activeSubscription[0];

//   // Check for existing pending renewal
//   const existingPending = await db
//     .select({ id: subscriptions.id })
//     .from(subscriptions)
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(
//       and(
//         eq(subscriptions.organizationId, organizationId),
//         eq(payment.status, "pending")
//       )
//     )
//     .limit(1);

//   if (existingPending && existingPending.length > 0) {
//     throw new BadRequest("You already have a pending request. Please wait for approval.");
//   }

//   // Get plan details
//   const planResult = await db
//     .select()
//     .from(plans)
//     .where(eq(plans.id, currentSub.planId))
//     .limit(1);

//   if (!planResult || planResult.length === 0) {
//     throw new NotFound("Plan not found");
//   }

//   const plan = planResult[0];

//   // Get payment method
//   const payMethodResult = await db
//     .select()
//     .from(paymentMethod)
//     .where(
//       and(eq(paymentMethod.id, paymentMethodId), eq(paymentMethod.isActive, true))
//     )
//     .limit(1);

//   if (!payMethodResult || payMethodResult.length === 0) {
//     throw new NotFound("Payment method not found or inactive");
//   }

//   const payMethod = payMethodResult[0];

//   // Calculate amount
//   const baseAmount =
//     duration === "semester" ? plan.price_semester : plan.price_year;
//   const fee = payMethod.feeStatus ? payMethod.feeAmount : 0;
//   const totalAmount = baseAmount + fee;

//   // Calculate new dates (starts from current subscription end date)
//   const startDate = new Date(currentSub.endDate);
//   const endDate = new Date(currentSub.endDate);
//   const monthsToAdd = duration === "semester" ? 6 : 12;
//   endDate.setMonth(endDate.getMonth() + monthsToAdd);

// // Save receipt image if provided
// let receiptImageUrl: string | null = null;
// if (receiptImage) {
//   const savedImage = await saveBase64Image(req, receiptImage, "payments/receipts");
//   receiptImageUrl = savedImage.url;
// }

//   // Create payment
//   const paymentId = uuidv4();
//   await db.execute(
//     sql`INSERT INTO payments (id, organization_id, plan_id, payment_method_id, amount, receipt_image, status)
//         VALUES (${paymentId}, ${organizationId}, ${currentSub.planId}, ${paymentMethodId}, ${totalAmount}, ${receiptImageUrl}, 'pending')`
//   );

//   // Create renewal subscription
//   const subscriptionId = uuidv4();
//   await db.execute(
//     sql`INSERT INTO subscriptions (id, plan_id, organization_id, start_date, end_date, payment_id, is_active)
//         VALUES (${subscriptionId}, ${currentSub.planId}, ${organizationId}, ${startDate}, ${endDate}, ${paymentId}, false)`
//   );

//   // Fetch created subscription
//   const renewedSubscription = await db
//     .select({
//       id: subscriptions.id,
//       startDate: subscriptions.startDate,
//       endDate: subscriptions.endDate,
//       isActive: subscriptions.isActive,
//       plan: {
//         id: plans.id,
//         name: plans.name,
//       },
//       payment: {
//         id: payment.id,
//         amount: payment.amount,
//         status: payment.status,
//         receiptImage: payment.receiptImage,
//       },
//     })
//     .from(subscriptions)
//     .leftJoin(plans, eq(subscriptions.planId, plans.id))
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(eq(subscriptions.id, subscriptionId))
//     .limit(1);

//   const addedDays = duration === "semester" ? 180 : 365;

//   SuccessResponse(
//     res,
//     {
//       message: "Renewal request submitted. Waiting for admin approval.",
//       currentSubscription: {
//         id: currentSub.id,
//         endDate: currentSub.endDate,
//       },
//       renewalSubscription: {
//         ...renewedSubscription[0],
//         addedDays,
//       },
//     },
//     201
//   );
// };

/**
 * Upgrade to a new plan
 */
// export const upgradeSubscription = async (req: Request, res: Response) => {
//   const { newPlanId, paymentMethodId, receiptImage } = req.body;
//   const organizationId = req.user?.organizationId;

//   if (!organizationId) {
//     throw new BadRequest("Organization ID is required");
//   }

//   if (!newPlanId || !paymentMethodId) {
//     throw new BadRequest("newPlanId and paymentMethodId are required");
//   }

//   // Get current active subscription
//   const activeSubscription = await db
//     .select({
//       id: subscriptions.id,
//       planId: subscriptions.planId,
//       startDate: subscriptions.startDate,
//       endDate: subscriptions.endDate,
//     })
//     .from(subscriptions)
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(
//       and(
//         eq(subscriptions.organizationId, organizationId),
//         eq(subscriptions.isActive, true),
//         eq(payment.status, "completed"),
//         gte(subscriptions.endDate, new Date())
//       )
//     )
//     .limit(1);

//   if (!activeSubscription || activeSubscription.length === 0) {
//     throw new NotFound("No active subscription to upgrade");
//   }

//   const currentSub = activeSubscription[0];

//   if (currentSub.planId === newPlanId) {
//     throw new BadRequest("You are already on this plan");
//   }

//   // Check for existing pending request
//   const existingPending = await db
//     .select({ id: subscriptions.id })
//     .from(subscriptions)
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(
//       and(
//         eq(subscriptions.organizationId, organizationId),
//         eq(payment.status, "pending")
//       )
//     )
//     .limit(1);

//   if (existingPending && existingPending.length > 0) {
//     throw new BadRequest("You already have a pending request. Please wait for approval.");
//   }

//   // Get old and new plan details
//   const oldPlanResult = await db
//     .select()
//     .from(plans)
//     .where(eq(plans.id, currentSub.planId))
//     .limit(1);

//   const newPlanResult = await db
//     .select()
//     .from(plans)
//     .where(eq(plans.id, newPlanId))
//     .limit(1);

//   if (!oldPlanResult.length || !newPlanResult.length) {
//     throw new NotFound("Plan not found");
//   }

//   const oldPlan = oldPlanResult[0];
//   const newPlan = newPlanResult[0];

//   // Get payment method
//   const payMethodResult = await db
//     .select()
//     .from(paymentMethod)
//     .where(
//       and(eq(paymentMethod.id, paymentMethodId), eq(paymentMethod.isActive, true))
//     )
//     .limit(1);

//   if (!payMethodResult || payMethodResult.length === 0) {
//     throw new NotFound("Payment method not found or inactive");
//   }

//   const payMethod = payMethodResult[0];

//   // Calculate remaining days
//   const now = new Date();
//   const remainingDays = Math.ceil(
//     (new Date(currentSub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
//   );

//   // Calculate price difference (pro-rated)
//   const oldDailyRate = oldPlan.price_year / 365;
//   const newDailyRate = newPlan.price_year / 365;
//   const priceDifference = (newDailyRate - oldDailyRate) * remainingDays;
//   const fee = payMethod.feeStatus ? payMethod.feeAmount : 0;
//   const totalAmount = Math.max(0, priceDifference) + fee;

//   // New subscription uses remaining period
//   const startDate = now;
//   const endDate = new Date(currentSub.endDate);

//   // Save receipt image if provided
// // Save receipt image if provided
// let receiptImageUrl: string | null = null;
// if (receiptImage) {
//   const savedImage = await saveBase64Image(req, receiptImage, "payments/receipts");
//   receiptImageUrl = savedImage.url;
// }


//   // Create payment
//   const paymentId = uuidv4();
//   await db.execute(
//     sql`INSERT INTO payments (id, organization_id, plan_id, payment_method_id, amount, receipt_image, status)
//         VALUES (${paymentId}, ${organizationId}, ${newPlanId}, ${paymentMethodId}, ${totalAmount}, ${receiptImageUrl}, 'pending')`
//   );

//   // Create upgrade subscription
//   const subscriptionId = uuidv4();
//   await db.execute(
//     sql`INSERT INTO subscriptions (id, plan_id, organization_id, start_date, end_date, payment_id, is_active)
//         VALUES (${subscriptionId}, ${newPlanId}, ${organizationId}, ${startDate}, ${endDate}, ${paymentId}, false)`
//   );

//   // Fetch created subscription
//   const upgradedSubscription = await db
//     .select({
//       id: subscriptions.id,
//       startDate: subscriptions.startDate,
//       endDate: subscriptions.endDate,
//       isActive: subscriptions.isActive,
//       plan: {
//         id: plans.id,
//         name: plans.name,
//       },
//       payment: {
//         id: payment.id,
//         amount: payment.amount,
//         status: payment.status,
//         receiptImage: payment.receiptImage,
//       },
//     })
//     .from(subscriptions)
//     .leftJoin(plans, eq(subscriptions.planId, plans.id))
//     .leftJoin(payment, eq(subscriptions.paymentId, payment.id))
//     .where(eq(subscriptions.id, subscriptionId))
//     .limit(1);

//   SuccessResponse(
//     res,
//     {
//       message: "Upgrade request submitted. Waiting for admin approval.",
//       currentSubscription: {
//         id: currentSub.id,
//         planName: oldPlan.name,
//       },
//       upgradeSubscription: {
//         ...upgradedSubscription[0],
//         remainingDays,
//         priceDifference: Math.max(0, priceDifference),
//         paymentFee: fee,
//       },
//     },
//     201
//   );
// };


// // ✅ Get Available Plans
// export const getAvailablePlans = async (req: Request, res: Response) => {
//   const allPlans = await db.select().from(plans);
//   SuccessResponse(res, { plans: allPlans }, 200);
// };

// // ✅ Get Payment Methods
// export const getPaymentMethods = async (req: Request, res: Response) => {
//   const activeMethods = await db
//     .select()
//     .from(paymentMethod)
//     .where(eq(paymentMethod.isActive, true));
//   SuccessResponse(res, { paymentMethods: activeMethods }, 200);
// };




