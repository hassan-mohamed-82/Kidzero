import { Request, Response } from "express";
import { db } from "../../../models/db";
import { notes, rideOccurrences, rides } from "../../../models/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";

export const getAllNotes = async (req: Request, res: Response) => {

    const { year, month, type, status = "active" } = req.query;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    // بناء الشروط
    const conditions: any[] = [eq(notes.organizationId, organizationId)];

    if (status && status !== "all") {
        conditions.push(eq(notes.status, status as "active" | "cancelled"));
    }

    if (type) {
        conditions.push(eq(notes.type, type as "holiday" | "event" | "other"));
    }

    const allNotes = await db
        .select()
        .from(notes)
        .where(and(...conditions))
        .orderBy(notes.date);

    // فلترة حسب السنة والشهر
    let filteredNotes = allNotes;

    if (year) {
        filteredNotes = filteredNotes.filter((n) => {
            const nYear = new Date(n.date).getFullYear();
            return nYear === Number(year);
        });
    }

    if (month) {
        filteredNotes = filteredNotes.filter((n) => {
            const nMonth = new Date(n.date).getMonth() + 1;
            return nMonth === Number(month);
        });
    }

    // تجميع حسب النوع
    const byType = {
        holiday: filteredNotes.filter((n) => n.type === "holiday"),
        event: filteredNotes.filter((n) => n.type === "event"),
        other: filteredNotes.filter((n) => n.type === "other"),
    };

    SuccessResponse(
        res,
        {
            notes: filteredNotes.map((n) => ({
                id: n.id,
                title: n.title,
                description: n.description,
                date: n.date,
                type: n.type,
                cancelRides: n.cancelRides,
                status: n.status,
                dayName: new Date(n.date).toLocaleDateString("ar-EG", { weekday: "long" }),
                createdAt: n.createdAt,
            })),
            byType: {
                holidays: byType.holiday.length,
                events: byType.event.length,
                other: byType.other.length,
            },
            total: filteredNotes.length,
        },
        200
    );
}

export const getNoteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const [note] = await db
        .select()
        .from(notes)
        .where(
            and(
                eq(notes.id, id),
                eq(notes.organizationId, organizationId)
            )
        )
        .limit(1);

    if (!note) {
        throw new NotFound("Note not found");
    }

    // جلب الرحلات المتأثرة
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
                eq(rides.organizationId, organizationId),
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