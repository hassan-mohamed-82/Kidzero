import { db } from "../models/db";
import { invoice, subscriptions, plans, organizations, payment } from "../models/schema";
import { eq, and, between, sql, lt } from "drizzle-orm";

export const generateRenewalInvoices = async () => {
  console.log("⏳ [CRON] Starting Invoice Generation Check...");

  const today = new Date();

  // Calculate the Target Date (7 days from now)
  const targetDate = new Date();
  targetDate.setDate(today.getDate() + 7);

  // Set time window to cover the entire target day (00:00:00 to 23:59:59)
  const startOfTargetDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfTargetDay = new Date(targetDate.setHours(23, 59, 59, 999));

  try {
    // Find Active Subscriptions ending in exactly 7 days
    // We join with the 'plans' table to get pricing info immediately
    const subsToRenew = await db
      .select({
        sub: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.isActive, true), // Only active subscriptions
          between(subscriptions.endDate, startOfTargetDay, endOfTargetDay)
        )
      );

    if (subsToRenew.length === 0) {
      console.log("✅ [CRON] No subscriptions expiring in 7 days.");
      return;
    }

    console.log(`found ${subsToRenew.length} subscriptions to process.`);

    // Process each subscription
    for (const record of subsToRenew) {
      const { sub, plan } = record;

      // --- Idempotency Check ---
      // Ensure we haven't ALREADY created an invoice for this specific expiration
      // We look for an invoice for this sub created within the last 24 hours
      const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
      const existingInvoice = await db
        .select()
        .from(invoice)
        .where(
          and(
            eq(invoice.subscriptionId, sub.id),
            between(invoice.issuedAt, startOfToday, new Date())
          )
        )
        .limit(1);

      if (existingInvoice.length > 0) {
        console.log(`⚠️ Invoice already exists for Subscription ${sub.id}. Skipping.`);
        continue;
      }

      // --- Determine Price (Semester vs Year) ---
      // We calculate the duration of the *current* subscription to decide the renewal price
      const durationMs = sub.endDate.getTime() - sub.startDate.getTime();
      const daysDuration = durationMs / (1000 * 60 * 60 * 24);

      // If duration is > 200 days, assume Yearly, otherwise Semester
      const amountToCharge = plan.price;

      // --- Create Invoice ---
      await db.insert(invoice).values({
        organizationId: sub.organizationId,
        subscriptionId: sub.id,
        planId: sub.planId,
        amount: amountToCharge,
        dueAt: sub.endDate, // The invoice is due on the day the sub ends
        status: "pending",
        // 'issuedAt' defaults to now(), 'id' defaults to UUID()
      });

      console.log(`✅ Generated invoice for Org: ${sub.organizationId}, Amount: ${amountToCharge}`);
    }

  } catch (err) {
    console.error("❌ [CRON] Error generating invoices:", err);
  }
};

/**
 * Check for expired subscriptions and deactivate them if no renewal payment is pending
 */
export const checkExpiredSubscriptions = async () => {
  console.log("⏳ [CRON] Checking for expired subscriptions...");

  const today = new Date();

  try {
    // Find active subscriptions that have ended (endDate < today)
    const expiredSubs = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.isActive, true),
          lt(subscriptions.endDate, today)
        )
      );

    if (expiredSubs.length === 0) {
      console.log("✅ [CRON] No expired subscriptions found.");
      return;
    }

    console.log(`📋 [CRON] Found ${expiredSubs.length} expired subscriptions to check.`);

    for (const sub of expiredSubs) {
      // Check if there's a pending renewal payment for this organization
      const pendingRenewal = await db
        .select()
        .from(payment)
        .where(
          and(
            eq(payment.organizationId, sub.organizationId),
            eq(payment.status, "pending"),
            eq(payment.paymentType, "renewal")
          )
        )
        .limit(1);

      if (pendingRenewal.length > 0) {
        console.log(`⏳ Subscription ${sub.id} has pending renewal, keeping active.`);
        continue;
      }

      // No pending renewal - deactivate the subscription
      await db.update(subscriptions)
        .set({ isActive: false })
        .where(eq(subscriptions.id, sub.id));

      // Update organization status to "active" (no longer subscribed)
      await db.update(organizations)
        .set({ status: "active" })
        .where(eq(organizations.id, sub.organizationId));

      console.log(`⛔ Deactivated subscription ${sub.id} for org ${sub.organizationId}`);
    }

    console.log("✅ [CRON] Expired subscription check completed.");

  } catch (err) {
    console.error("❌ [CRON] Error checking expired subscriptions:", err);
  }
};