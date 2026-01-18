"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const cronServices_1 = require("./cronServices");
const startCronJobs = () => {
    // Schedule: Every day at 00:00 (Midnight)
    // Format: "minute hour day-of-month month day-of-week"
    node_cron_1.default.schedule("0 0 * * *", async () => {
        console.log("--- Triggering Daily Cron Jobs ---");
        await (0, cronServices_1.generateRenewalInvoices)();
        await (0, cronServices_1.checkExpiredSubscriptions)();
    });
    console.log("🕒 Cron Jobs Initialized");
};
exports.startCronJobs = startCronJobs;
