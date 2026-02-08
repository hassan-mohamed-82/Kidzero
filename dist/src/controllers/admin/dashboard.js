"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeDashboard = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const drizzle_orm_2 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const getHomeDashboard = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization not found");
    }
    const organization = await db_1.db.query.organizations.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.organizations.id, organizationId) });
    if (!organization) {
        throw new BadRequest_1.BadRequest("Organization not found");
    }
    const totalBuses = await db_1.db.query.buses.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.buses.organizationId, organizationId) });
    const totalDrivers = await db_1.db.query.drivers.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId) });
    const totalCoDrivers = await db_1.db.query.codrivers.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId) });
    const totalUsers = await db_1.db.query.students.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId) });
    const activeRides = await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.isActive, "on")) });
    const completedRides = await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.status, "completed")) });
    const totalRoutes = await db_1.db.query.Rout.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.Rout.organizationId, organizationId) });
    const stats = {
        totalBuses: totalBuses.length,
        totalDrivers: totalDrivers.length,
        totalCoDrivers: totalCoDrivers.length,
        totalUsers: totalUsers.length,
        activeRides: activeRides.length,
        completedRides: completedRides.length,
        totalRoutes: totalRoutes.length,
    };
    // Graphs
    // Chart 1
    const afternoonRides = await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.rideType, "afternoon")) });
    const morningRides = await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.rideType, "morning")) });
    const chart1 = {
        afternoonRides: afternoonRides.length,
        morningRides: morningRides.length,
    };
    // // Chart 2 - Number of Rides in Zone Name
    // const zonesData = await db.select(
    //     {
    //         zoneName: zones.name,
    //         count: sql<number>`COUNT(${rides.id})`,
    //     }
    // ).from(zones).groupBy(zones.name)
    // const chart2 = {
    //     zonesData
    // } // --> الزون ملهاش علاقه بالرايد؟؟؟
    // Chart 3 - Count of Rides by Ride Status
    const chart3 = {
        scheduled: (await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.status, "scheduled")) })).length,
        inProgress: (await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.status, "in_progress")) })).length,
        completed: (await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.status, "completed")) })).length,
        cancelled: (await db_1.db.query.rides.findMany({ where: (0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.rides.status, "cancelled")) })).length,
    };
    // Chart 4 - Number of students in every Pickup Point
    const pickupPointDataRaw = await db_1.db
        .select({
        id: schema_1.pickupPoints.id,
        name: schema_1.pickupPoints.name,
        count: (0, drizzle_orm_1.sql) `COUNT(${schema_1.rideStudents.studentId})`
    })
        .from(schema_1.rideStudents)
        .leftJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_1.eq)(schema_1.pickupPoints.organizationId, organizationId))
        .groupBy(schema_1.pickupPoints.id, schema_1.pickupPoints.name);
    const chart4 = {
        pickupPointData: pickupPointDataRaw
    };
    // Chart 5 - Time taken for Pickup (Ride Start -> Student Pickup)
    // We start from rideStudents (which has pickedUpAt) and join with rides (which has startedAt)
    // Filter for completed rides or where pickedUpAt is not null
    const rideTimingData = await db_1.db
        .select({
        rideId: schema_1.rides.id,
        pickupPointName: schema_1.pickupPoints.name,
        studentId: schema_1.rideStudents.studentId,
        startedAt: schema_1.rides.startedAt,
        pickedUpAt: schema_1.rideStudents.pickedUpAt,
        // Calculate difference in minutes: (pickedUpAt - startedAt)
        // TIMESTAMPDIFF(MINUTE, started_at, picked_up_at)
        timeTakenMinutes: (0, drizzle_orm_1.sql) `TIMESTAMPDIFF(MINUTE, ${schema_1.rides.startedAt}, ${schema_1.rideStudents.pickedUpAt})`
    })
        .from(schema_1.rideStudents)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideStudents.rideId, schema_1.rides.id))
        .innerJoin(schema_1.pickupPoints, (0, drizzle_orm_1.eq)(schema_1.rideStudents.pickupPointId, schema_1.pickupPoints.id))
        .where((0, drizzle_orm_2.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `${schema_1.rideStudents.pickedUpAt} IS NOT NULL`, (0, drizzle_orm_1.sql) `${schema_1.rides.startedAt} IS NOT NULL`))
        // Limit to recent rides or sensible limit if needed, for now just taking all relevant data
        .limit(100);
    const chart5 = {
        rideTimingData
    };
    // Chart 6 - Installment Due Date and Installment Amount
    const installmentData = await db_1.db
        .select({
        dueDate: schema_1.feeInstallments.dueDate,
        amount: schema_1.feeInstallments.installmentAmount,
        status: schema_1.feeInstallments.status
    })
        .from(schema_1.feeInstallments)
        .where((0, drizzle_orm_1.eq)(schema_1.feeInstallments.organizationId, organizationId));
    // Process for chart: X-axis: Due Date, Y-axis: Amount, Color: Paid (approved) vs Not Paid (others)
    const chart6 = {
        installmentData: installmentData.map(inst => ({
            ...inst,
            statusCategory: inst.status === 'approved' ? 'Paid' : 'Not Paid'
        }))
    };
    // Chart 7 - Student Balance Ranges
    // Ranges: < 0, 0, 0-100, 100-500, > 500 (Example ranges, dynamically adjusting based on data is harder in SQL without CTEs or complex CASE)
    // Easier to fetch balances and bucket in JS, or use a manual CASE statement.
    // Let's fetch all student balances and bucket them in JS to be safe and dynamic.
    const studentsBalances = await db_1.db
        .select({
        balance: schema_1.students.walletBalance
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId));
    // Define buckets
    const ranges = {
        'Negative': 0,
        'Zero': 0,
        '0-100': 0,
        '100-500': 0,
        '500+': 0
    };
    studentsBalances.forEach(s => {
        const bal = parseFloat(s.balance?.toString() || "0");
        if (bal < 0)
            ranges['Negative']++;
        else if (bal === 0)
            ranges['Zero']++;
        else if (bal <= 100)
            ranges['0-100']++;
        else if (bal <= 500)
            ranges['100-500']++;
        else
            ranges['500+']++;
    });
    const chart7 = {
        balanceRanges: Object.entries(ranges).map(([range, count]) => ({ range, count }))
    };
    return (0, response_1.SuccessResponse)(res, {
        message: "Dashboard Retreived Successfully",
        stats,
        chart1,
        chart3,
        chart4,
        chart5,
        chart6,
        chart7
    }, 200);
};
exports.getHomeDashboard = getHomeDashboard;
