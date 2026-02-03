import { Request, Response } from "express";
import { db } from "../../models/db";
import { organizations, buses, drivers, codrivers, students, rides, Rout, zones, rideStudents, pickupPoints, feeInstallments } from "../../models/schema";
import { eq, sql } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
export const getHomeDashboard = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization not found");
    }
    const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
    if (!organization) {
        throw new BadRequest("Organization not found");
    }

    const totalBuses = await db.query.buses.findMany({ where: eq(buses.organizationId, organizationId) });
    const totalDrivers = await db.query.drivers.findMany({ where: eq(drivers.organizationId, organizationId) });
    const totalCoDrivers = await db.query.codrivers.findMany({ where: eq(codrivers.organizationId, organizationId) });
    const totalUsers = await db.query.students.findMany({ where: eq(students.organizationId, organizationId) });
    const activeRides = await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.isActive, "on")) });
    const completedRides = await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.status, "completed")) });
    const totalRoutes = await db.query.Rout.findMany({ where: eq(Rout.organizationId, organizationId) });

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
    const afternoonRides = await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.rideType, "afternoon")) });
    const morningRides = await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.rideType, "morning")) });
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
        scheduled: (await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.status, "scheduled")) })).length,
        inProgress: (await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.status, "in_progress")) })).length,
        completed: (await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.status, "completed")) })).length,
        cancelled: (await db.query.rides.findMany({ where: and(eq(rides.organizationId, organizationId), eq(rides.status, "cancelled")) })).length,
    }
    // Chart 4 - Number of students in every Pickup Point
    const pickupPointDataRaw = await db
        .select({
            id: pickupPoints.id,
            name: pickupPoints.name,
            count: sql<number>`COUNT(${rideStudents.studentId})`
        })
        .from(rideStudents)
        .leftJoin(pickupPoints, eq(rideStudents.pickupPointId, pickupPoints.id))
        .where(eq(pickupPoints.organizationId, organizationId))
        .groupBy(pickupPoints.id, pickupPoints.name);

    const chart4 = {
        pickupPointData: pickupPointDataRaw
    };

    // Chart 5 - Time taken for Pickup (Ride Start -> Student Pickup)
    // We start from rideStudents (which has pickedUpAt) and join with rides (which has startedAt)
    // Filter for completed rides or where pickedUpAt is not null
    const rideTimingData = await db
        .select({
            rideId: rides.id,
            pickupPointName: pickupPoints.name,
            studentId: rideStudents.studentId,
            startedAt: rides.startedAt,
            pickedUpAt: rideStudents.pickedUpAt,
            // Calculate difference in minutes: (pickedUpAt - startedAt)
            // TIMESTAMPDIFF(MINUTE, started_at, picked_up_at)
            timeTakenMinutes: sql<number>`TIMESTAMPDIFF(MINUTE, ${rides.startedAt}, ${rideStudents.pickedUpAt})`
        })
        .from(rideStudents)
        .innerJoin(rides, eq(rideStudents.rideId, rides.id))
        .innerJoin(pickupPoints, eq(rideStudents.pickupPointId, pickupPoints.id))
        .where(
            and(
                eq(rides.organizationId, organizationId),
                sql`${rideStudents.pickedUpAt} IS NOT NULL`,
                sql`${rides.startedAt} IS NOT NULL`
            )
        )
        // Limit to recent rides or sensible limit if needed, for now just taking all relevant data
        .limit(100);

    const chart5 = {
        rideTimingData
    };

    // Chart 6 - Installment Due Date and Installment Amount
    const installmentData = await db
        .select({
            dueDate: feeInstallments.dueDate,
            amount: feeInstallments.installmentAmount,
            status: feeInstallments.status
        })
        .from(feeInstallments)
        .where(eq(feeInstallments.organizationId, organizationId));

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
    const studentsBalances = await db
        .select({
            balance: students.walletBalance
        })
        .from(students)
        .where(eq(students.organizationId, organizationId));

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
        if (bal < 0) ranges['Negative']++;
        else if (bal === 0) ranges['Zero']++;
        else if (bal <= 100) ranges['0-100']++;
        else if (bal <= 500) ranges['100-500']++;
        else ranges['500+']++;
    });

    const chart7 = {
        balanceRanges: Object.entries(ranges).map(([range, count]) => ({ range, count }))
    };

    return SuccessResponse(res, {
        message: "Dashboard Retreived Successfully",
        stats,
        chart1,
        chart3,
        chart4,
        chart5,
        chart6,
        chart7
    }, 200);
}