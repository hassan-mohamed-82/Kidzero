"use strict";
// src/controllers/admin/noteController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingNotes = exports.deleteNote = exports.updateNote = exports.getNoteById = exports.getAllNotes = exports.createNote = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const uuid_1 = require("uuid");
const firebase_1 = require("../../utils/firebase");
// ✅ إنشاء ملاحظة/إجازة جديدة
const createNote = async (req, res) => {
    const { title, description, date, type = "holiday", cancelRides = true } = req.body;
    const organizationId = req.user?.organizationId;
    const adminId = req.user?.id;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!title || !date) {
        throw new BadRequest_1.BadRequest("Title and date are required");
    }
    const noteDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (noteDate < today) {
        throw new BadRequest_1.BadRequest("Cannot create note for past dates");
    }
    // تحقق من عدم وجود ملاحظة في نفس اليوم بنفس النوع
    const [existingNote] = await db_1.db
        .select()
        .from(schema_1.notes)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.notes.date, date), (0, drizzle_orm_1.eq)(schema_1.notes.type, type), (0, drizzle_orm_1.eq)(schema_1.notes.status, "active")))
        .limit(1);
    if (existingNote) {
        throw new BadRequest_1.BadRequest(`${type} already exists for this date`);
    }
    const noteId = (0, uuid_1.v4)();
    // إنشاء الملاحظة
    await db_1.db.insert(schema_1.notes).values({
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
    (0, response_1.SuccessResponse)(res, {
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
    }, 201);
};
exports.createNote = createNote;
// ✅ جلب جميع الملاحظات
const getAllNotes = async (req, res) => {
    const { year, month, type, status = "active" } = req.query;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // بناء الشروط
    const conditions = [(0, drizzle_orm_1.eq)(schema_1.notes.organizationId, organizationId)];
    if (status && status !== "all") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.notes.status, status));
    }
    if (type) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.notes.type, type));
    }
    const allNotes = await db_1.db
        .select()
        .from(schema_1.notes)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy(schema_1.notes.date);
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
    (0, response_1.SuccessResponse)(res, {
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
    }, 200);
};
exports.getAllNotes = getAllNotes;
// ✅ جلب ملاحظة بالـ ID
const getNoteById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const [note] = await db_1.db
        .select()
        .from(schema_1.notes)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.id, id), (0, drizzle_orm_1.eq)(schema_1.notes.organizationId, organizationId)))
        .limit(1);
    if (!note) {
        throw new NotFound_1.NotFound("Note not found");
    }
    // جلب الرحلات المتأثرة
    const affectedOccurrences = await db_1.db
        .select({
        id: schema_1.rideOccurrences.id,
        status: schema_1.rideOccurrences.status,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${note.date}`));
    (0, response_1.SuccessResponse)(res, {
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
    }, 200);
};
exports.getNoteById = getNoteById;
// ✅ تعديل ملاحظة
const updateNote = async (req, res) => {
    const { id } = req.params;
    const { title, description, type } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const [note] = await db_1.db
        .select()
        .from(schema_1.notes)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.id, id), (0, drizzle_orm_1.eq)(schema_1.notes.organizationId, organizationId)))
        .limit(1);
    if (!note) {
        throw new NotFound_1.NotFound("Note not found");
    }
    const updateData = {};
    if (title)
        updateData.title = title;
    if (description !== undefined)
        updateData.description = description;
    if (type)
        updateData.type = type;
    if (Object.keys(updateData).length === 0) {
        throw new BadRequest_1.BadRequest("No data to update");
    }
    await db_1.db.update(schema_1.notes).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.notes.id, id));
    (0, response_1.SuccessResponse)(res, {
        message: "تم تحديث الملاحظة بنجاح",
        note: {
            id,
            ...updateData,
        },
    }, 200);
};
exports.updateNote = updateNote;
// ✅ حذف/إلغاء ملاحظة
const deleteNote = async (req, res) => {
    const { id } = req.params;
    const { restoreRides = false } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const [note] = await db_1.db
        .select()
        .from(schema_1.notes)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.id, id), (0, drizzle_orm_1.eq)(schema_1.notes.organizationId, organizationId)))
        .limit(1);
    if (!note) {
        throw new NotFound_1.NotFound("Note not found");
    }
    let restoredOccurrences = 0;
    // استعادة الرحلات إذا طُلب ذلك
    if (restoreRides && note.cancelRides) {
        restoredOccurrences = await restoreOccurrencesForDate(organizationId, note.date instanceof Date ? note.date.toISOString().split("T")[0] : String(note.date));
    }
    // إلغاء الملاحظة (soft delete)
    await db_1.db
        .update(schema_1.notes)
        .set({ status: "cancelled" })
        .where((0, drizzle_orm_1.eq)(schema_1.notes.id, id));
    (0, response_1.SuccessResponse)(res, {
        message: "تم إلغاء الملاحظة بنجاح",
        noteId: id,
        restoredOccurrences,
    }, 200);
};
exports.deleteNote = deleteNote;
// ✅ جلب الملاحظات القادمة
const getUpcomingNotes = async (req, res) => {
    const { days = 30 } = req.query;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + Number(days));
    const todayStr = today.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    const upcomingNotes = await db_1.db
        .select()
        .from(schema_1.notes)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.notes.status, "active"), (0, drizzle_orm_1.sql) `${schema_1.notes.date} >= ${todayStr}`, (0, drizzle_orm_1.sql) `${schema_1.notes.date} <= ${endDateStr}`))
        .orderBy(schema_1.notes.date);
    (0, response_1.SuccessResponse)(res, {
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
    }, 200);
};
exports.getUpcomingNotes = getUpcomingNotes;
// ============ Helper Functions ============
// إلغاء الرحلات في تاريخ معين
async function cancelOccurrencesForDate(organizationId, date) {
    // جلب الـ occurrences في هذا التاريخ
    const occurrences = await db_1.db
        .select({
        id: schema_1.rideOccurrences.id,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${date}`, (0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.status, ["scheduled", "in_progress"])));
    if (occurrences.length === 0) {
        return 0;
    }
    const occurrenceIds = occurrences.map((o) => o.id);
    // إلغاء الـ occurrences
    await db_1.db
        .update(schema_1.rideOccurrences)
        .set({
        status: "cancelled",
        completedAt: (0, drizzle_orm_1.sql) `NOW()`,
    })
        .where((0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.id, occurrenceIds));
    return occurrences.length;
}
// استعادة الرحلات في تاريخ معين
async function restoreOccurrencesForDate(organizationId, date) {
    const occurrences = await db_1.db
        .select({
        id: schema_1.rideOccurrences.id,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${date}`, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.status, "cancelled")));
    if (occurrences.length === 0) {
        return 0;
    }
    const occurrenceIds = occurrences.map((o) => o.id);
    await db_1.db
        .update(schema_1.rideOccurrences)
        .set({
        status: "scheduled",
        completedAt: null,
    })
        .where((0, drizzle_orm_1.inArray)(schema_1.rideOccurrences.id, occurrenceIds));
    return occurrences.length;
}
// إرسال إشعارات للأهالي
async function notifyParentsAboutNote(organizationId, date, title, description, type) {
    // جلب الطلاب المتأثرين
    const affectedStudents = await db_1.db
        .select({
        studentId: schema_1.rideOccurrenceStudents.studentId,
        parentId: schema_1.students.parentId,
        studentName: schema_1.students.name,
        fcmTokens: schema_1.parents.fcmTokens,
    })
        .from(schema_1.rideOccurrenceStudents)
        .innerJoin(schema_1.rideOccurrences, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.occurrenceId, schema_1.rideOccurrences.id))
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.rideOccurrenceStudents.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${date}`));
    // تجميع حسب الـ parent
    const parentMap = new Map();
    for (const s of affectedStudents) {
        if (s.parentId) {
            if (!parentMap.has(s.parentId)) {
                parentMap.set(s.parentId, { fcmTokens: s.fcmTokens, children: [] });
            }
            parentMap.get(s.parentId).children.push(s.studentName);
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
        await db_1.db.insert(schema_1.notifications).values({
            id: (0, uuid_1.v4)(),
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
                    await (0, firebase_1.sendPushNotification)(tokens, notificationTitle, notificationBody, {
                        type: "holiday",
                        date,
                    });
                    notificationsSent++;
                }
            }
            catch (error) {
                console.error(`Failed to send notification to parent ${parentId}:`, error);
            }
        }
    }
    return notificationsSent;
}
