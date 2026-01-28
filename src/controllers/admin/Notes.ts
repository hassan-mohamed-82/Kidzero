// src/controllers/admin/noteController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import {
    notes,
    rideOccurrences,
    rideOccurrenceStudents,
    rides,
    students,
    parents,
    notifications,
} from "../../models/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { v4 as uuidv4 } from "uuid";
import { sendPushNotification } from "../../utils/firebase";

// ✅ إنشاء ملاحظة/إجازة جديدة
export const createNote = async (req: Request, res: Response) => {
    const { title, description, date, type = "holiday", cancelRides = true } = req.body;
    const organizationId = req.user?.organizationId;
    const adminId = req.user?.id;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    if (!title || !date) {
        throw new BadRequest("Title and date are required");
    }

    const noteDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (noteDate < today) {
        throw new BadRequest("Cannot create note for past dates");
    }

    // تحقق من عدم وجود ملاحظة في نفس اليوم بنفس النوع
    const [existingNote] = await db
        .select()
        .from(notes)
        .where(
            and(
                eq(notes.organizationId, organizationId),
                eq(notes.date, date),
                eq(notes.type, type),
                eq(notes.status, "active")
            )
        )
        .limit(1);

    if (existingNote) {
        throw new BadRequest(`${type} already exists for this date`);
    }

    const noteId = uuidv4();

    // إنشاء الملاحظة
    await db.insert(notes).values({
        id: noteId,
        organizationId,
        title,
        description: description || null,
        date,
        type,
        cancelRides,
        createdBy: adminId,
    });

    let cancelledOccurrences = 0;
    let notificationsSent = 0;

    // إلغاء الرحلات إذا كان cancelRides = true
    if (cancelRides && (type === "holiday" || type === "event")) {
        cancelledOccurrences = await cancelOccurrencesForDate(organizationId, date);
        notificationsSent = await notifyParentsAboutNote(organizationId, date, title, description, type);
    }

    SuccessResponse(
        res,
        {
            message: "تم إنشاء الملاحظة بنجاح",
            note: {
                id: noteId,
                title,
                description,
                date,
                type,
                cancelRides,
            },
            cancelledOccurrences,
            notificationsSent,
        },
        201
    );
};

// ✅ جلب جميع الملاحظات
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
        conditions.push(eq(notes.type, type as "holiday" | "event" | "announcement" | "other"));
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
        announcement: filteredNotes.filter((n) => n.type === "announcement"),
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
                announcements: byType.announcement.length,
                other: byType.other.length,
            },
            total: filteredNotes.length,
        },
        200
    );
};

// ✅ جلب ملاحظة بالـ ID
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
};

// ✅ تعديل ملاحظة
export const updateNote = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, type } = req.body;
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

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;

    if (Object.keys(updateData).length === 0) {
        throw new BadRequest("No data to update");
    }

    await db.update(notes).set(updateData).where(eq(notes.id, id));

    SuccessResponse(
        res,
        {
            message: "تم تحديث الملاحظة بنجاح",
            note: {
                id,
                ...updateData,
            },
        },
        200
    );
};

// ✅ حذف/إلغاء ملاحظة
export const deleteNote = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { restoreRides = false } = req.body;
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

    let restoredOccurrences = 0;

    // استعادة الرحلات إذا طُلب ذلك
    if (restoreRides && note.cancelRides) {
        restoredOccurrences = await restoreOccurrencesForDate(organizationId, note.date instanceof Date ? note.date.toISOString().split("T")[0] : String(note.date));
    }

    // إلغاء الملاحظة (soft delete)
    await db
        .update(notes)
        .set({ status: "cancelled" })
        .where(eq(notes.id, id));

    SuccessResponse(
        res,
        {
            message: "تم إلغاء الملاحظة بنجاح",
            noteId: id,
            restoredOccurrences,
        },
        200
    );
};

// ✅ جلب الملاحظات القادمة
export const getUpcomingNotes = async (req: Request, res: Response) => {
    const { days = 30 } = req.query;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new BadRequest("Organization ID is required");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + Number(days));

    const todayStr = today.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const upcomingNotes = await db
        .select()
        .from(notes)
        .where(
            and(
                eq(notes.organizationId, organizationId),
                eq(notes.status, "active"),
                sql`${notes.date} >= ${todayStr}`,
                sql`${notes.date} <= ${endDateStr}`
            )
        )
        .orderBy(notes.date);

    SuccessResponse(
        res,
        {
            notes: upcomingNotes.map((n) => ({
                id: n.id,
                title: n.title,
                description: n.description,
                date: n.date,
                type: n.type,
                cancelRides: n.cancelRides,
                dayName: new Date(n.date).toLocaleDateString("ar-EG", { weekday: "long" }),
                daysUntil: Math.ceil((new Date(n.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            })),
            total: upcomingNotes.length,
        },
        200
    );
};

// ============ Helper Functions ============

// إلغاء الرحلات في تاريخ معين
async function cancelOccurrencesForDate(organizationId: string, date: string): Promise<number> {
    // جلب الـ occurrences في هذا التاريخ
    const occurrences = await db
        .select({
            id: rideOccurrences.id,
        })
        .from(rideOccurrences)
        .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
        .where(
            and(
                eq(rides.organizationId, organizationId),
                sql`DATE(${rideOccurrences.occurDate}) = ${date}`,
                inArray(rideOccurrences.status, ["scheduled", "in_progress"])
            )
        );

    if (occurrences.length === 0) {
        return 0;
    }

    const occurrenceIds = occurrences.map((o) => o.id);

    // إلغاء الـ occurrences
    await db
        .update(rideOccurrences)
        .set({
            status: "cancelled",
            completedAt: sql`NOW()`,
        })
        .where(inArray(rideOccurrences.id, occurrenceIds));

    return occurrences.length;
}

// استعادة الرحلات في تاريخ معين
async function restoreOccurrencesForDate(organizationId: string, date: string): Promise<number> {
    const occurrences = await db
        .select({
            id: rideOccurrences.id,
        })
        .from(rideOccurrences)
        .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
        .where(
            and(
                eq(rides.organizationId, organizationId),
                sql`DATE(${rideOccurrences.occurDate}) = ${date}`,
                eq(rideOccurrences.status, "cancelled")
            )
        );

    if (occurrences.length === 0) {
        return 0;
    }

    const occurrenceIds = occurrences.map((o) => o.id);

    await db
        .update(rideOccurrences)
        .set({
            status: "scheduled",
            completedAt: null,
        })
        .where(inArray(rideOccurrences.id, occurrenceIds));

    return occurrences.length;
}

// إرسال إشعارات للأهالي
async function notifyParentsAboutNote(
    organizationId: string,
    date: string,
    title: string,
    description: string | null,
    type: string
): Promise<number> {
    // جلب الطلاب المتأثرين
    const affectedStudents = await db
        .select({
            studentId: rideOccurrenceStudents.studentId,
            parentId: students.parentId,
            studentName: students.name,
            fcmTokens: parents.fcmTokens,
        })
        .from(rideOccurrenceStudents)
        .innerJoin(rideOccurrences, eq(rideOccurrenceStudents.occurrenceId, rideOccurrences.id))
        .innerJoin(rides, eq(rideOccurrences.rideId, rides.id))
        .innerJoin(students, eq(rideOccurrenceStudents.studentId, students.id))
        .leftJoin(parents, eq(students.parentId, parents.id))
        .where(
            and(
                eq(rides.organizationId, organizationId),
                sql`DATE(${rideOccurrences.occurDate}) = ${date}`
            )
        );

    // تجميع حسب الـ parent
    const parentMap = new Map<string, { fcmTokens: string | null; children: string[] }>();

    for (const s of affectedStudents) {
        if (s.parentId) {
            if (!parentMap.has(s.parentId)) {
                parentMap.set(s.parentId, { fcmTokens: s.fcmTokens, children: [] });
            }
            parentMap.get(s.parentId)!.children.push(s.studentName);
        }
    }

    let notificationsSent = 0;
    const formattedDate = new Date(date).toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const notificationTitle = type === "holiday" ? "إجازة رسمية" : "إعلان هام";
    const notificationBody = `${title}\nتاريخ: ${formattedDate}\n${description || "تم إلغاء جميع الرحلات في هذا اليوم"}`;

    for (const [parentId, data] of parentMap) {
        // حفظ الإشعار في قاعدة البيانات
        await db.insert(notifications).values({
            id: uuidv4(),
            userId: parentId,
            userType: "parent",
            title: notificationTitle,
            body: notificationBody,
            type: "holiday",
            data: JSON.stringify({ date, noteTitle: title, children: data.children }),
        });

        // إرسال Push Notification
        if (data.fcmTokens) {
            try {
                const tokens = typeof data.fcmTokens === "string"
                    ? JSON.parse(data.fcmTokens)
                    : data.fcmTokens;

                if (Array.isArray(tokens) && tokens.length > 0) {
                    await sendPushNotification(tokens, notificationTitle, notificationBody, {
                        type: "holiday",
                        date,
                    });
                    notificationsSent++;
                }
            } catch (error) {
                console.error(`Failed to send notification to parent ${parentId}:`, error);
            }
        }
    }

    return notificationsSent;
}
