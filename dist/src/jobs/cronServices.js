"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredSubscriptions = exports.generateRenewalInvoices = void 0;
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const generateRenewalInvoices = async () => {
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
        const subsToRenew = await db_1.db
            .select({
            sub: schema_1.subscriptions,
            plan: schema_1.plans,
        })
            .from(schema_1.subscriptions)
            .innerJoin(schema_1.plans, (0, drizzle_orm_1.eq)(schema_1.subscriptions.planId, schema_1.plans.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true), // Only active subscriptions
        (0, drizzle_orm_1.between)(schema_1.subscriptions.endDate, startOfTargetDay, endOfTargetDay)));
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
            const existingInvoice = await db_1.db
                .select()
                .from(schema_1.invoice)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.invoice.subscriptionId, sub.id), (0, drizzle_orm_1.between)(schema_1.invoice.issuedAt, startOfToday, new Date())))
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
            await db_1.db.insert(schema_1.invoice).values({
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
    }
    catch (err) {
        console.error("❌ [CRON] Error generating invoices:", err);
    }
};
exports.generateRenewalInvoices = generateRenewalInvoices;
/**
 * Check for expired subscriptions and deactivate them if no renewal payment is pending
 */
const checkExpiredSubscriptions = async () => {
    console.log("⏳ [CRON] Checking for expired subscriptions...");
    const today = new Date();
    try {
        // Find active subscriptions that have ended (endDate < today)
        const expiredSubs = await db_1.db
            .select()
            .from(schema_1.subscriptions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true), (0, drizzle_orm_1.lt)(schema_1.subscriptions.endDate, today)));
        if (expiredSubs.length === 0) {
            console.log("✅ [CRON] No expired subscriptions found.");
            return;
        }
        console.log(`📋 [CRON] Found ${expiredSubs.length} expired subscriptions to check.`);
        for (const sub of expiredSubs) {
            // Check if there's a pending renewal payment for this organization
            const pendingRenewal = await db_1.db
                .select()
                .from(schema_1.payment)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payment.organizationId, sub.organizationId), (0, drizzle_orm_1.eq)(schema_1.payment.status, "pending"), (0, drizzle_orm_1.eq)(schema_1.payment.paymentType, "renewal")))
                .limit(1);
            if (pendingRenewal.length > 0) {
                console.log(`⏳ Subscription ${sub.id} has pending renewal, keeping active.`);
                continue;
            }
            // No pending renewal - deactivate the subscription
            await db_1.db.update(schema_1.subscriptions)
                .set({ isActive: false })
                .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, sub.id));
            // Update organization status to "active" (no longer subscribed)
            await db_1.db.update(schema_1.organizations)
                .set({ status: "active" })
                .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, sub.organizationId));
            console.log(`⛔ Deactivated subscription ${sub.id} for org ${sub.organizationId}`);
        }
        console.log("✅ [CRON] Expired subscription check completed.");
    }
    catch (err) {
        console.error("❌ [CRON] Error checking expired subscriptions:", err);
    }
};
exports.checkExpiredSubscriptions = checkExpiredSubscriptions;
