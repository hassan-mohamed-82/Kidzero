"use strict";
// src/controllers/users/parent/rides.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyChildren = exports.addChild = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const BadRequest_1 = require("../../../Errors/BadRequest");
const Errors_1 = require("../../../Errors");
// ================== Add Child (محدّث) ==================
const addChild = async (req, res) => {
    const parentId = req.user?.id;
    const { code } = req.body;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("غير مصرح");
    }
    if (!code) {
        throw new BadRequest_1.BadRequest("كود الطالب مطلوب");
    }
    // Find student by code
    const [student] = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.code, code.toUpperCase().trim()))
        .limit(1);
    if (!student) {
        throw new NotFound_1.NotFound("كود الطالب غير صحيح");
    }
    if (student.parentId) {
        throw new BadRequest_1.BadRequest("هذا الطالب مرتبط بولي أمر آخر");
    }
    // ✅ ربط الطالب بولي الأمر فقط (بدون تحديث organizationId في Parent)
    await db_1.db
        .update(schema_1.students)
        .set({ parentId })
        .where((0, drizzle_orm_1.eq)(schema_1.students.id, student.id));
    return (0, response_1.SuccessResponse)(res, {
        message: "تم إضافة الطفل بنجاح",
        student: {
            id: student.id,
            name: student.name,
            grade: student.grade,
            classroom: student.classroom,
            code: student.code,
            organizationId: student.organizationId, // ✅ إرجاع الـ org للـ Frontend
            wallet: {
                balance: Number(student.walletBalance) || 0,
            },
        },
    }, 200);
};
exports.addChild = addChild;
// ================== Get My Children (محدّث - مع Organization) ==================
const getMyChildren = async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("غير مصرح");
    }
    const children = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        code: schema_1.students.code,
        walletBalance: schema_1.students.walletBalance,
        nfcId: schema_1.students.nfcId,
        status: schema_1.students.status,
        organizationId: schema_1.students.organizationId,
        organizationName: schema_1.organizations.name, // ✅ اسم المدرسة
        organizationLogo: schema_1.organizations.logo, // ✅ لوجو المدرسة
    })
        .from(schema_1.students)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.students.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    // ✅ Group by organization
    const childrenByOrg = children.reduce((acc, child) => {
        const orgId = child.organizationId;
        if (!acc[orgId]) {
            acc[orgId] = {
                organization: {
                    id: child.organizationId,
                    name: child.organizationName,
                    logo: child.organizationLogo,
                },
                children: [],
            };
        }
        acc[orgId].children.push({
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            grade: child.grade,
            classroom: child.classroom,
            code: child.code,
            status: child.status,
            hasNfc: !!child.nfcId,
            wallet: {
                balance: Number(child.walletBalance) || 0,
            },
        });
        return acc;
    }, {});
    return (0, response_1.SuccessResponse)(res, {
        children: children.map((c) => ({
            id: c.id,
            name: c.name,
            avatar: c.avatar,
            grade: c.grade,
            classroom: c.classroom,
            code: c.code,
            status: c.status,
            hasNfc: !!c.nfcId,
            wallet: {
                balance: Number(c.walletBalance) || 0,
            },
            organization: {
                id: c.organizationId,
                name: c.organizationName,
                logo: c.organizationLogo,
            },
        })),
        // ✅ Grouped by organization
        byOrganization: Object.values(childrenByOrg),
        totalChildren: children.length,
    }, 200);
};
exports.getMyChildren = getMyChildren;
