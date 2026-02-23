"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingNotes = exports.getNoteById = exports.getAllNotes = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const BadRequest_1 = require("../../../Errors/BadRequest");
const getAllNotes = async (req, res) => {
    const { year, month, type, status = "active", organizationId } = req.query;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent ID is required");
    }
    // Get all students for this parent to find their organizations
    const parentStudents = await db_1.db
        .select({ organizationId: schema_1.students.organizationId })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (!parentStudents.length) {
        return (0, response_1.SuccessResponse)(res, {
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
        if (!studentOrgIds.includes(organizationId)) {
            throw new BadRequest_1.BadRequest("You do not have access to notes from this organization");
        }
        targetOrgIds = [organizationId];
    }
    // Build conditions
    const conditions = [(0, drizzle_orm_1.inArray)(schema_1.notes.organizationId, targetOrgIds)];
    if (status && status !== "all") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.notes.status, status));
    }
    if (type) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.notes.type, type));
    }
    if (year) {
        conditions.push((0, drizzle_orm_1.sql) `YEAR(${schema_1.notes.date}) = ${year}`);
    }
    if (month) {
        conditions.push((0, drizzle_orm_1.sql) `MONTH(${schema_1.notes.date}) = ${month}`);
    }
    const results = await db_1.db
        .select({
        note: schema_1.notes,
        organization: {
            name: schema_1.organizations.name,
            logo: schema_1.organizations.logo
        }
    })
        .from(schema_1.notes)
        .innerJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.notes.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.notes.date));
    // Grouping by type
    const byType = {
        holiday: results.filter((r) => r.note.type === "holiday"),
        event: results.filter((r) => r.note.type === "event"),
        other: results.filter((r) => r.note.type === "other"),
    };
    (0, response_1.SuccessResponse)(res, {
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
    }, 200);
};
exports.getAllNotes = getAllNotes;
const getNoteById = async (req, res) => {
    const { id } = req.params;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent ID is required");
    }
    // Get parent's students organizations to verify access
    const parentStudents = await db_1.db
        .select({ organizationId: schema_1.students.organizationId })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    const allowedOrgIds = [...new Set(parentStudents.map(s => s.organizationId))];
    if (allowedOrgIds.length === 0) {
        throw new NotFound_1.NotFound("Note not found or access denied");
    }
    const [result] = await db_1.db
        .select({
        note: schema_1.notes,
        organization: {
            name: schema_1.organizations.name,
            logo: schema_1.organizations.logo
        }
    })
        .from(schema_1.notes)
        .innerJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.notes.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.id, id), (0, drizzle_orm_1.inArray)(schema_1.notes.organizationId, allowedOrgIds)))
        .limit(1);
    if (!result) {
        throw new NotFound_1.NotFound("Note not found");
    }
    const { note, organization } = result;
    // Fetch affected rides
    // We need to show rides that belong to the organization of the note and match the date
    const affectedOccurrences = await db_1.db
        .select({
        id: schema_1.rideOccurrences.id,
        status: schema_1.rideOccurrences.status,
        rideName: schema_1.rides.name,
        rideType: schema_1.rides.rideType,
    })
        .from(schema_1.rideOccurrences)
        .innerJoin(schema_1.rides, (0, drizzle_orm_1.eq)(schema_1.rideOccurrences.rideId, schema_1.rides.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rides.organizationId, note.organizationId), (0, drizzle_orm_1.sql) `DATE(${schema_1.rideOccurrences.occurDate}) = ${note.date}`));
    (0, response_1.SuccessResponse)(res, {
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
    }, 200);
};
exports.getNoteById = getNoteById;
const getUpcomingNotes = async (req, res) => {
    const { days = 30 } = req.query;
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent ID is required");
    }
    // Get parent's students organizations
    const parentStudents = await db_1.db
        .select({ organizationId: schema_1.students.organizationId })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    if (!parentStudents.length) {
        return (0, response_1.SuccessResponse)(res, { notes: [], total: 0 }, 200);
    }
    const allowedOrgIds = [...new Set(parentStudents.map(s => s.organizationId))];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + Number(days));
    const todayStr = today.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    const upcomingNotes = await db_1.db
        .select({
        note: schema_1.notes,
        organization: {
            name: schema_1.organizations.name,
            logo: schema_1.organizations.logo
        }
    })
        .from(schema_1.notes)
        .innerJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.notes.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.notes.organizationId, allowedOrgIds), (0, drizzle_orm_1.eq)(schema_1.notes.status, "active"), (0, drizzle_orm_1.sql) `${schema_1.notes.date} >= ${todayStr}`, (0, drizzle_orm_1.sql) `${schema_1.notes.date} <= ${endDateStr}`))
        .orderBy(schema_1.notes.date);
    (0, response_1.SuccessResponse)(res, {
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
    }, 200);
};
exports.getUpcomingNotes = getUpcomingNotes;
