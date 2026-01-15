import cron from "node-cron";
import { generateRenewalInvoices, checkExpiredSubscriptions } from "./cronServices";

export const startCronJobs = () => {
  // Schedule: Every day at 00:00 (Midnight)
  // Format: "minute hour day-of-month month day-of-week"
  cron.schedule("0 0 * * *", async () => {
    console.log("--- Triggering Daily Cron Jobs ---");
    await generateRenewalInvoices();
    await checkExpiredSubscriptions();
  });

  console.log("🕒 Cron Jobs Initialized");
};