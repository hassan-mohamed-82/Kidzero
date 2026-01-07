"use strict";
// src/utils/subscriptionCheck.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageInfo = exports.checkStudentLimit = exports.checkDriverLimit = exports.checkBusLimit = exports.getActiveSubscription = void 0;
const Errors_1 = require("../Errors");
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const schema_2 = require("../models/schema");
const schema_3 = require("../models/schema");
const schema_4 = require("../models/schema"); // لو عايز تستخدمه لاحقاً
const schema_5 = require("../models/schema"); // لو عايز تستخدمه لاحقاً
const drizzle_orm_1 = require("drizzle-orm");
// جلب الاشتراك النشط مع الخطة
const getActiveSubscription = async (organizationId) => {
    const now = new Date();
    const result = await db_1.db
        .select({
        subscription: schema_1.subscriptions,
        plan: schema_2.plans,
    })
        .from(schema_1.subscriptions)
        .innerJoin(schema_2.plans, (0, drizzle_orm_1.eq)(schema_1.subscriptions.planId, schema_2.plans.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.isActive, true), (0, drizzle_orm_1.gte)(schema_1.subscriptions.endDate, now)))
        .limit(1);
    return result[0] || null;
};
exports.getActiveSubscription = getActiveSubscription;
// ✅ التحقق من حد الباصات
const checkBusLimit = async (organizationId) => {
    const activeSubscription = await (0, exports.getActiveSubscription)(organizationId);
    if (!activeSubscription) {
        throw new Errors_1.ForbiddenError("No active subscription found. Please subscribe to a plan first.");
    }
    const { plan } = activeSubscription;
    if (plan.maxBuses === null) {
        return;
    }
    const [busCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_3.buses)
        .where((0, drizzle_orm_1.eq)(schema_3.buses.organizationId, organizationId));
    if (busCount.count >= plan.maxBuses) {
        throw new Errors_1.ForbiddenError(`Bus limit reached (${busCount.count}/${plan.maxBuses}). Please upgrade your plan.`);
    }
};
exports.checkBusLimit = checkBusLimit;
// ✅ التحقق من حد السائقين
const checkDriverLimit = async (organizationId) => {
    const activeSubscription = await (0, exports.getActiveSubscription)(organizationId);
    if (!activeSubscription) {
        throw new Errors_1.ForbiddenError("No active subscription found. Please subscribe to a plan first.");
    }
    const { plan } = activeSubscription;
    if (plan.maxDrivers === null) {
        return;
    }
    const [driverCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_4.drivers)
        .where((0, drizzle_orm_1.eq)(schema_4.drivers.organizationId, organizationId));
    if (driverCount.count >= plan.maxDrivers) {
        throw new Errors_1.ForbiddenError(`Driver limit reached (${driverCount.count}/${plan.maxDrivers}). Please upgrade your plan.`);
    }
};
exports.checkDriverLimit = checkDriverLimit;
// ✅ التحقق من حد الطلاب
const checkStudentLimit = async (organizationId) => {
    const activeSubscription = await (0, exports.getActiveSubscription)(organizationId);
    if (!activeSubscription) {
        throw new Errors_1.ForbiddenError("No active subscription found. Please subscribe to a plan first.");
    }
    const { plan } = activeSubscription;
    if (plan.maxStudents === null) {
        return;
    }
    const [studentCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_5.students)
        .where((0, drizzle_orm_1.eq)(schema_5.students.organizationId, organizationId));
    if (studentCount.count >= plan.maxStudents) {
        throw new Errors_1.ForbiddenError(`Student limit reached (${studentCount.count}/${plan.maxStudents}). Please upgrade your plan.`);
    }
};
exports.checkStudentLimit = checkStudentLimit;
// ✅ جلب كل معلومات الاستخدام
const getUsageInfo = async (organizationId) => {
    const activeSubscription = await (0, exports.getActiveSubscription)(organizationId);
    if (!activeSubscription) {
        return null;
    }
    const { plan, subscription } = activeSubscription;
    const [busCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_3.buses)
        .where((0, drizzle_orm_1.eq)(schema_3.buses.organizationId, organizationId));
    const [driverCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_4.drivers)
        .where((0, drizzle_orm_1.eq)(schema_4.drivers.organizationId, organizationId));
    const [studentCount] = await db_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_5.students)
        .where((0, drizzle_orm_1.eq)(schema_5.students.organizationId, organizationId));
    return {
        plan: {
            id: plan.id,
            name: plan.name,
        },
        usage: {
            buses: {
                used: busCount.count,
                max: plan.maxBuses,
                remaining: plan.maxBuses ? plan.maxBuses - busCount.count : "unlimited",
            },
            drivers: {
                used: driverCount.count,
                max: plan.maxDrivers,
                remaining: plan.maxDrivers ? plan.maxDrivers - driverCount.count : "unlimited",
            },
            students: {
                used: studentCount.count,
                max: plan.maxStudents,
                remaining: plan.maxStudents ? plan.maxStudents - studentCount.count : "unlimited",
            },
        },
        subscription: {
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            isActive: subscription.isActive,
        },
    };
};
exports.getUsageInfo = getUsageInfo;
