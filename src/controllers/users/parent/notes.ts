import { Request, Response } from "express";
import { db } from "../../../models/db";
import { notes, rideOccurrences, rides, students, organizations } from "../../../models/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";

export const getAllNotes = async (req: Request, res: Response) => {

    const { year, month, type, status = "active", organizationId } = req.query;
    const parentId = req.user?.id;

    if (!parentId) {
        throw new BadRequest("Parent ID is required");
    }

    // Get all students for this parent to find their organizations
    const parentStudents = await db
        .select({ organizationId: students.organizationId })
        .from(students)
        .where(eq(students.parentId, parentId));

    if (!parentStudents.length) {
        return SuccessResponse(res, {
            notes: [],
            byType: { holidays: 0, events: 0, other: 0 },
            total: 0
        }, 200);
    }

    // Extract unique organization IDs
    const studentOrgIds = [...new Set(parentStudents.map(s => s.organizationId))];

    // Check if user requested specific organization and if they have access to it
    let targetOrgIds = studentOrgIds;
    if (organizationId) {
        if (!studentOrgIds.includes(organizationId as string)) {
            throw new BadRequest("You do not have access to notes from this organization");
        }
        targetOrgIds = [organizationId as string];
    }

    // Build conditions
    const conditions: any[] = [inArray(notes.organizationId, targetOrgIds)];

    if (status && status !== "all") {
        conditions.push(eq(notes.status, status as "active" | "cancelled"));
    }

    if (type) {
        conditions.push(eq(notes.type, type as "holiday" | "event" | "other"));
    }

    if (year) {
        conditions.push(sql`YEAR(${notes.date}) = ${year}`);
    }

    if (month) {
        conditions.push(sql`MONTH(${notes.date}) = ${month}`);
    }

    const results = await db
        .select({
            note: notes,
            organization: {
                name: organizations.name,
                logo: organizations.logo
            }
        })
        .from(notes)
        .innerJoin(organizations, eq(notes.organizationId, organizations.id))
        .where(and(...conditions))
        .orderBy(desc(notes.date));

    // Grouping by type
    const byType = {
        holiday: results.filter((r) => r.note.type === "holiday"),
        event: results.filter((r) => r.note.type === "event"),
        other: results.filter((r) => r.note.type === "other"),
    };

    SuccessResponse(
        res,
        {
            notes: results.map((r) => ({
                id: r.note.id,
                title: r.note.title,
                description: r.note.description,
                date: r.note.date,
                type: r.note.type,
                cancelRides: r.note.cancelRides,
                status: r.note.status,
                organizationId: r.note.organizationId,
                organization: r.organization,
                dayName: new Date(r.note.date).toLocaleDateString("ar-EG", { weekday: "long" }),
                createdAt: r.note.createdAt,
            })),
            byType: {
                holidays: byType.holiday.length,
                events: byType.event.length,
                other: byType.other.length,
            },
            total: results.length,
        },
        200
    );
}

export const getNoteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const parentId = req.user?.id;

    if (!parentId) {
        throw new BadRequest("Parent ID is required");
    }

    // Get parent's students organizations to verify access
    const parentStudents = await db
        .select({ organizationId: students.organizationId })
        .from(students)
        .where(eq(students.parentId, parentId));

    const allowedOrgIds = [...new Set(parentStudents.map(s => s.organizationId))];

    if (allowedOrgIds.length === 0) {
        throw new NotFound("Note not found or access denied");
    }

    const [result] = await db
        .select({
            note: notes,
            organization: {
                name: organizations.name,
                logo: organizations.logo
            }
        })
        .from(notes)
        .innerJoin(organizations, eq(notes.organizationId, organizations.id))
        .where(
            and(
                eq(notes.id, id),
                inArray(notes.organizationId, allowedOrgIds)
            )
        )
        .limit(1);

    if (!result) {
        throw new NotFound("Note not found");
    }

    const { note, organization } = result;

    // Fetch affected rides
    // We need to show rides that belong to the organization of the note and match the date
    const affectedOccurrences = await db
        .select({
            id: rideOccurrences.id,
            status: rideOccurrences.status,
            rideName: rides.name,
            rideType: rides.rideType,
        })
        .from(rideOccurrences)
        .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
        .where(
            and(
                eq(rides.organizationId, note.organizationId),
                sql`DATE(${rideOccurrences.occurDate}) = ${note.date}`
            )
        );

    SuccessResponse(
        res,
        {
            note: {
                id: note.id,
                title: note.title,
                description: note.description,
                date: note.date,
                type: note.type,
                cancelRides: note.cancelRides,
                status: note.status,
                organizationId: note.organizationId,
                organization: organization,
                dayName: new Date(note.date).toLocaleDateString("ar-EG", { weekday: "long" }),
                createdAt: note.createdAt,
            },
            affectedRides: {
                total: affectedOccurrences.length,
                cancelled: affectedOccurrences.filter((o) => o.status === "cancelled").length,
                list: affectedOccurrences,
            },
        },
        200
    );
}

export const getUpcomingNotes = async (req: Request, res: Response) => {
    const { days = 30 } = req.query;
    const parentId = req.user?.id;

    if (!parentId) {
        throw new BadRequest("Parent ID is required");
    }

    // Get parent's students organizations
    const parentStudents = await db
        .select({ organizationId: students.organizationId })
        .from(students)
        .where(eq(students.parentId, parentId));

    if (!parentStudents.length) {
        return SuccessResponse(res, { notes: [], total: 0 }, 200);
    }

    const allowedOrgIds = [...new Set(parentStudents.map(s => s.organizationId))];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + Number(days));

    const todayStr = today.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const upcomingNotes = await db
        .select({
            note: notes,
            organization: {
                name: organizations.name,
                logo: organizations.logo
            }
        })
        .from(notes)
        .innerJoin(organizations, eq(notes.organizationId, organizations.id))
        .where(
            and(
                inArray(notes.organizationId, allowedOrgIds),
                eq(notes.status, "active"),
                sql`${notes.date} >= ${todayStr}`,
                sql`${notes.date} <= ${endDateStr}`
            )
        )
        .orderBy(notes.date);

    SuccessResponse(
        res,
        {
            notes: upcomingNotes.map((r) => ({
                id: r.note.id,
                title: r.note.title,
                description: r.note.description,
                date: r.note.date,
                type: r.note.type,
                cancelRides: r.note.cancelRides,
                organization: r.organization,
                dayName: new Date(r.note.date).toLocaleDateString("ar-EG", { weekday: "long" }),
                daysUntil: Math.ceil((new Date(r.note.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            })),
            total: upcomingNotes.length,
        },
        200
    );
}