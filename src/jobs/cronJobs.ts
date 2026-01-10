import cron from "node-cron";
import { generateRenewalInvoices } from "./cronServices";

export const startCronJobs = () => {
  // Schedule: Every day at 00:00 (Midnight)
  // Format: "minute hour day-of-month month day-of-week"
  cron.schedule("0 0 * * *", async () => {
    console.log("--- Triggering Daily Invoice Job ---");
    await generateRenewalInvoices();
  });
  
  console.log("🕒 Cron Jobs Initialized");
};