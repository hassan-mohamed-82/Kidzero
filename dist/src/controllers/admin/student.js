"use strict";
// src/controllers/admin/studentController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentsWithoutParent = exports.selection = exports.deleteStudent = exports.updateStudent = exports.getStudentById = exports.getAllStudents = exports.createStudent = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const uuid_1 = require("uuid");
const GenerateUniqueCode_1 = require("../../utils/GenerateUniqueCode");
// ✅ Create Student (بدون Parent - بيتربط بعدين بالـ Code)
// src/controllers/admin/studentController.ts
const createStudent = async (req, res) => {
    const { name, avatar, grade, classroom, zoneId } = req.body;
    // ✅ تأكد من استخدام req.admin مش req.user
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    if (!name) {
        throw new BadRequest_1.BadRequest("Student name is required");
    }
    if (!zoneId) {
        throw new BadRequest_1.BadRequest("Zone ID is required");
    }
    // تحقق من الـ Zone
    const [zone] = await db_1.db
        .select()
        .from(schema_1.zones)
        .where((0, drizzle_orm_1.eq)(schema_1.zones.id, zoneId))
        .limit(1);
    if (!zone) {
        throw new NotFound_1.NotFound("Zone not found");
    }
    // Generate unique code
    const code = await (0, GenerateUniqueCode_1.generateUniqueStudentCode)();
    const studentId = (0, uuid_1.v4)();
    // معالجة الصورة
    let avatarUrl = null;
    if (avatar) {
        const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `students/${studentId}`);
        avatarUrl = result.url;
    }
    // ✅ الإدراج - بدون parentId خالص (هيكون null تلقائي)
    await db_1.db.insert(schema_1.students).values({
        id: studentId,
        organizationId,
        // ❌ لا تضع parentId هنا - خليه يكون undefined فيتجاهله
        code,
        zoneId,
        name,
        avatar: avatarUrl,
        grade: grade || null,
        classroom: classroom || null,
    });
    return (0, response_1.SuccessResponse)(res, {
        message: "Student created successfully",
        student: {
            id: studentId,
            name,
            code, // ✅ الكود اللي هيديه الأدمن لولي الأمر
            grade,
            classroom,
            avatar: avatarUrl,
        },
    }, 201);
};
exports.createStudent = createStudent;
// ✅ Get All Students
const getAllStudents = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allStudents = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        code: schema_1.students.code, // ✅
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        walletBalance: schema_1.students.walletBalance, // ✅
        nfcId: schema_1.students.nfcId, // ✅
        status: schema_1.students.status,
        createdAt: schema_1.students.createdAt,
        parentId: schema_1.students.parentId,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        zoneId: schema_1.zones.id,
        zoneName: schema_1.zones.name,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.zones, (0, drizzle_orm_1.eq)(schema_1.students.zoneId, schema_1.zones.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId));
    const formattedStudents = allStudents.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        avatar: s.avatar,
        grade: s.grade,
        classroom: s.classroom,
        status: s.status,
        createdAt: s.createdAt,
        hasParent: !!s.parentId, // ✅
        hasNfc: !!s.nfcId, // ✅
        wallet: {
            balance: Number(s.walletBalance) || 0,
        },
        parent: s.parentId
            ? {
                id: s.parentId,
                name: s.parentName,
                phone: s.parentPhone,
            }
            : null,
        zone: s.zoneId
            ? {
                id: s.zoneId,
                name: s.zoneName,
            }
            : null,
    }));
    (0, response_1.SuccessResponse)(res, { students: formattedStudents }, 200);
};
exports.getAllStudents = getAllStudents;
// ✅ Get Student By ID
const getStudentById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const [student] = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        code: schema_1.students.code,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        walletBalance: schema_1.students.walletBalance,
        nfcId: schema_1.students.nfcId,
        status: schema_1.students.status,
        createdAt: schema_1.students.createdAt,
        updatedAt: schema_1.students.updatedAt,
        parentId: schema_1.students.parentId,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        parentEmail: schema_1.parents.email,
        parentAddress: schema_1.parents.address,
        zoneId: schema_1.zones.id,
        zoneName: schema_1.zones.name,
        zoneCost: schema_1.zones.cost,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.students.parentId, schema_1.parents.id))
        .leftJoin(schema_1.zones, (0, drizzle_orm_1.eq)(schema_1.students.zoneId, schema_1.zones.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, id), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)))
        .limit(1);
    if (!student) {
        throw new NotFound_1.NotFound("Student not found");
    }
    (0, response_1.SuccessResponse)(res, {
        student: {
            id: student.id,
            name: student.name,
            code: student.code,
            avatar: student.avatar,
            grade: student.grade,
            classroom: student.classroom,
            status: student.status,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt,
            hasParent: !!student.parentId,
            hasNfc: !!student.nfcId,
            wallet: {
                balance: Number(student.walletBalance) || 0,
            },
            parent: student.parentId
                ? {
                    id: student.parentId,
                    name: student.parentName,
                    phone: student.parentPhone,
                    email: student.parentEmail,
                    address: student.parentAddress,
                }
                : null,
            zone: student.zoneId
                ? {
                    id: student.zoneId,
                    name: student.zoneName,
                    cost: student.zoneCost,
                }
                : null,
        },
    }, 200);
};
exports.getStudentById = getStudentById;
// ✅ Update Student
const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { name, avatar, grade, classroom, status, zoneId } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const [existingStudent] = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, id), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)))
        .limit(1);
    if (!existingStudent) {
        throw new NotFound_1.NotFound("Student not found");
    }
    // تحقق من الـ Zone الجديد
    if (zoneId && zoneId !== existingStudent.zoneId) {
        const [zone] = await db_1.db
            .select()
            .from(schema_1.zones)
            .where((0, drizzle_orm_1.eq)(schema_1.zones.id, zoneId))
            .limit(1);
        if (!zone) {
            throw new NotFound_1.NotFound("Zone not found");
        }
    }
    // معالجة الصورة
    let avatarUrl = existingStudent.avatar;
    if (avatar !== undefined) {
        if (existingStudent.avatar) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingStudent.avatar);
        }
        if (avatar) {
            const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `students/${id}`);
            avatarUrl = result.url;
        }
        else {
            avatarUrl = null;
        }
    }
    await db_1.db
        .update(schema_1.students)
        .set({
        zoneId: zoneId ?? existingStudent.zoneId,
        name: name ?? existingStudent.name,
        avatar: avatarUrl,
        grade: grade !== undefined ? grade : existingStudent.grade,
        classroom: classroom !== undefined ? classroom : existingStudent.classroom,
        status: status ?? existingStudent.status,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.students.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Student updated successfully" }, 200);
};
exports.updateStudent = updateStudent;
// ✅ Delete Student
const deleteStudent = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const [existingStudent] = await db_1.db
        .select()
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, id), (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)))
        .limit(1);
    if (!existingStudent) {
        throw new NotFound_1.NotFound("Student not found");
    }
    if (existingStudent.avatar) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingStudent.avatar);
    }
    await db_1.db.delete(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Student deleted successfully" }, 200);
};
exports.deleteStudent = deleteStudent;
// ✅ Selection (للـ Dropdowns)
const selection = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // ✅ كل الـ zones (مشتركة)
    const allZones = await db_1.db
        .select({
        id: schema_1.zones.id,
        name: schema_1.zones.name,
        cost: schema_1.zones.cost,
    })
        .from(schema_1.zones);
    (0, response_1.SuccessResponse)(res, {
        zones: allZones,
    }, 200);
};
exports.selection = selection;
// ✅ Get Students Without Parent (الطلاب اللي مش مربوطين بولي أمر)
const getStudentsWithoutParent = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const studentsWithoutParent = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        code: schema_1.students.code,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
        createdAt: schema_1.students.createdAt,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId), (0, drizzle_orm_1.isNull)(schema_1.students.parentId)));
    (0, response_1.SuccessResponse)(res, {
        students: studentsWithoutParent,
        count: studentsWithoutParent.length,
    }, 200);
};
exports.getStudentsWithoutParent = getStudentsWithoutParent;
