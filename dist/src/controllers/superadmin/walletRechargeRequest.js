"use strict";
// src/controllers/superAdmin/walletController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletStats = exports.rejectRechargeRequest = exports.approveRechargeRequest = exports.getRechargeRequestById = exports.getAllRechargeRequests = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const uuid_1 = require("uuid");
// ✅ جلب كل طلبات الشحن
const getAllRechargeRequests = async (req, res) => {
    const { status, organizationId } = req.query;
    // بناء الشروط
    let conditions = [];
    if (status && status !== "all") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.status, status));
    }
    if (organizationId) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.organizationId, organizationId));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const requests = await db_1.db
        .select({
        id: schema_1.walletRechargeRequests.id,
        amount: schema_1.walletRechargeRequests.amount,
        proofImage: schema_1.walletRechargeRequests.proofImage,
        status: schema_1.walletRechargeRequests.status,
        notes: schema_1.walletRechargeRequests.notes,
        createdAt: schema_1.walletRechargeRequests.createdAt,
        reviewedAt: schema_1.walletRechargeRequests.reviewedAt,
        // Student
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentAvatar: schema_1.students.avatar,
        studentBalance: schema_1.students.walletBalance,
        // Parent
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        // Payment Method
        paymentMethodId: schema_1.paymentMethod.id,
        paymentMethodName: schema_1.paymentMethod.name,
        paymentMethodLogo: schema_1.paymentMethod.logo,
        // Organization
        organizationId: schema_1.organizations.id,
        organizationName: schema_1.organizations.name,
        organizationLogo: schema_1.organizations.logo,
    })
        .from(schema_1.walletRechargeRequests)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.studentId, schema_1.students.id))
        .innerJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.parentId, schema_1.parents.id))
        .innerJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.paymentMethodId, schema_1.paymentMethod.id))
        .innerJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.organizationId, schema_1.organizations.id))
        .where(whereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.walletRechargeRequests.createdAt));
    const formattedRequests = requests.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        proofImage: r.proofImage,
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
        student: {
            id: r.studentId,
            name: r.studentName,
            avatar: r.studentAvatar,
            currentBalance: Number(r.studentBalance) || 0,
        },
        parent: {
            id: r.parentId,
            name: r.parentName,
            phone: r.parentPhone,
        },
        paymentMethod: {
            id: r.paymentMethodId,
            name: r.paymentMethodName,
            logo: r.paymentMethodLogo,
        },
        organization: {
            id: r.organizationId,
            name: r.organizationName,
            logo: r.organizationLogo,
        },
    }));
    // إحصائيات
    const allStats = await db_1.db
        .select({
        status: schema_1.walletRechargeRequests.status,
        amount: schema_1.walletRechargeRequests.amount,
    })
        .from(schema_1.walletRechargeRequests);
    const stats = {
        total: allStats.length,
        pending: allStats.filter((r) => r.status === "pending").length,
        approved: allStats.filter((r) => r.status === "approved").length,
        rejected: allStats.filter((r) => r.status === "rejected").length,
        pendingAmount: allStats
            .filter((r) => r.status === "pending")
            .reduce((sum, r) => sum + Number(r.amount), 0),
        approvedAmount: allStats
            .filter((r) => r.status === "approved")
            .reduce((sum, r) => sum + Number(r.amount), 0),
    };
    (0, response_1.SuccessResponse)(res, {
        requests: formattedRequests,
        stats,
    }, 200);
};
exports.getAllRechargeRequests = getAllRechargeRequests;
// ✅ جلب طلب شحن بالتفصيل
// src/controllers/superAdmin/walletController.ts
const getRechargeRequestById = async (req, res) => {
    const { requestId } = req.params;
    const result = await db_1.db
        .select({
        id: schema_1.walletRechargeRequests.id,
        amount: schema_1.walletRechargeRequests.amount,
        proofImage: schema_1.walletRechargeRequests.proofImage,
        status: schema_1.walletRechargeRequests.status,
        notes: schema_1.walletRechargeRequests.notes,
        createdAt: schema_1.walletRechargeRequests.createdAt,
        reviewedAt: schema_1.walletRechargeRequests.reviewedAt,
        // Student - بدون grade و classroom لو مش موجودين
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        studentAvatar: schema_1.students.avatar,
        studentWalletBalance: schema_1.students.walletBalance,
        // Parent - بدون email لو مش موجود
        parentId: schema_1.parents.id,
        parentName: schema_1.parents.name,
        parentPhone: schema_1.parents.phone,
        // Payment Method
        paymentMethodId: schema_1.paymentMethod.id,
        paymentMethodName: schema_1.paymentMethod.name,
        paymentMethodLogo: schema_1.paymentMethod.logo,
        // Organization
        organizationId: schema_1.organizations.id,
        organizationName: schema_1.organizations.name,
        organizationLogo: schema_1.organizations.logo,
    })
        .from(schema_1.walletRechargeRequests)
        .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.studentId, schema_1.students.id))
        .leftJoin(schema_1.parents, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.parentId, schema_1.parents.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.paymentMethodId, schema_1.paymentMethod.id))
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.id, requestId))
        .limit(1);
    if (!result.length) {
        throw new NotFound_1.NotFound("Recharge request not found");
    }
    const request = result[0];
    (0, response_1.SuccessResponse)(res, {
        request: {
            id: request.id,
            amount: request.amount,
            proofImage: request.proofImage,
            status: request.status,
            notes: request.notes,
            createdAt: request.createdAt,
            reviewedAt: request.reviewedAt,
            student: {
                id: request.studentId,
                name: request.studentName,
                avatar: request.studentAvatar,
                walletBalance: request.studentWalletBalance,
            },
            parent: {
                id: request.parentId,
                name: request.parentName,
                phone: request.parentPhone,
            },
            paymentMethod: {
                id: request.paymentMethodId,
                name: request.paymentMethodName,
                logo: request.paymentMethodLogo,
            },
            organization: {
                id: request.organizationId,
                name: request.organizationName,
                logo: request.organizationLogo,
            },
        },
    }, 200);
};
exports.getRechargeRequestById = getRechargeRequestById;
// ✅ الموافقة على طلب الشحن
const approveRechargeRequest = async (req, res) => {
    const { requestId } = req.params;
    // جلب الطلب
    const [request] = await db_1.db
        .select({
        id: schema_1.walletRechargeRequests.id,
        studentId: schema_1.walletRechargeRequests.studentId,
        organizationId: schema_1.walletRechargeRequests.organizationId,
        amount: schema_1.walletRechargeRequests.amount,
        status: schema_1.walletRechargeRequests.status,
        paymentMethodName: schema_1.paymentMethod.name,
    })
        .from(schema_1.walletRechargeRequests)
        .innerJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.paymentMethodId, schema_1.paymentMethod.id))
        .where((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.id, requestId))
        .limit(1);
    if (!request) {
        throw new NotFound_1.NotFound("Request not found");
    }
    if (request.status !== "pending") {
        throw new BadRequest_1.BadRequest(`الطلب ${request.status === "approved" ? "تمت الموافقة عليه" : "مرفوض"} بالفعل`);
    }
    // جلب رصيد الطالب الحالي
    const [student] = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        walletBalance: schema_1.students.walletBalance,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.id, request.studentId))
        .limit(1);
    if (!student) {
        throw new NotFound_1.NotFound("Student not found");
    }
    const currentBalance = Number(student.walletBalance) || 0;
    const rechargeAmount = Number(request.amount);
    const newBalance = currentBalance + rechargeAmount;
    // Transaction
    await db_1.db.transaction(async (tx) => {
        // 1) تحديث رصيد الطالب
        await tx
            .update(schema_1.students)
            .set({ walletBalance: newBalance.toString() })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, request.studentId));
        // 2) تسجيل المعاملة
        await tx.insert(schema_1.walletTransactions).values({
            id: (0, uuid_1.v4)(),
            organizationId: request.organizationId,
            studentId: request.studentId,
            type: "recharge",
            amount: rechargeAmount.toString(),
            balanceBefore: currentBalance.toString(),
            balanceAfter: newBalance.toString(),
            referenceId: request.id,
            referenceType: "recharge_request",
            description: `شحن عبر ${request.paymentMethodName}`,
        });
        // 3) تحديث حالة الطلب
        await tx
            .update(schema_1.walletRechargeRequests)
            .set({
            status: "approved",
            reviewedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.id, requestId));
    });
    // TODO: إرسال إشعار لولي الأمر
    (0, response_1.SuccessResponse)(res, {
        message: "تمت الموافقة على طلب الشحن بنجاح",
        request: {
            id: requestId,
            status: "approved",
        },
        student: {
            id: student.id,
            name: student.name,
            previousBalance: currentBalance,
            rechargeAmount,
            newBalance,
        },
    }, 200);
};
exports.approveRechargeRequest = approveRechargeRequest;
// ✅ رفض طلب الشحن
const rejectRechargeRequest = async (req, res) => {
    const { requestId } = req.params;
    const { reason } = req.body;
    // جلب الطلب
    const [request] = await db_1.db
        .select()
        .from(schema_1.walletRechargeRequests)
        .where((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.id, requestId))
        .limit(1);
    if (!request) {
        throw new NotFound_1.NotFound("Request not found");
    }
    if (request.status !== "pending") {
        throw new BadRequest_1.BadRequest(`الطلب ${request.status === "approved" ? "تمت الموافقة عليه" : "مرفوض"} بالفعل`);
    }
    // تحديث حالة الطلب
    await db_1.db
        .update(schema_1.walletRechargeRequests)
        .set({
        status: "rejected",
        notes: reason || null,
        reviewedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.id, requestId));
    // TODO: إرسال إشعار لولي الأمر بسبب الرفض
    (0, response_1.SuccessResponse)(res, {
        message: "تم رفض طلب الشحن",
        request: {
            id: requestId,
            status: "rejected",
            reason: reason || null,
        },
    }, 200);
};
exports.rejectRechargeRequest = rejectRechargeRequest;
// ✅ إحصائيات المحافظ
const getWalletStats = async (req, res) => {
    const { organizationId } = req.query;
    // إجمالي الأرصدة
    let balanceCondition = organizationId
        ? (0, drizzle_orm_1.eq)(schema_1.students.organizationId, organizationId)
        : undefined;
    const studentsData = await db_1.db
        .select({
        walletBalance: schema_1.students.walletBalance,
    })
        .from(schema_1.students)
        .where(balanceCondition);
    const totalBalance = studentsData.reduce((sum, s) => sum + (Number(s.walletBalance) || 0), 0);
    const studentsWithBalance = studentsData.filter((s) => Number(s.walletBalance) > 0).length;
    // إحصائيات الطلبات
    let requestsCondition = organizationId
        ? (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.organizationId, organizationId)
        : undefined;
    const requestsData = await db_1.db
        .select({
        status: schema_1.walletRechargeRequests.status,
        amount: schema_1.walletRechargeRequests.amount,
    })
        .from(schema_1.walletRechargeRequests)
        .where(requestsCondition);
    const requestsStats = {
        total: requestsData.length,
        pending: {
            count: requestsData.filter((r) => r.status === "pending").length,
            amount: requestsData
                .filter((r) => r.status === "pending")
                .reduce((sum, r) => sum + Number(r.amount), 0),
        },
        approved: {
            count: requestsData.filter((r) => r.status === "approved").length,
            amount: requestsData
                .filter((r) => r.status === "approved")
                .reduce((sum, r) => sum + Number(r.amount), 0),
        },
        rejected: {
            count: requestsData.filter((r) => r.status === "rejected").length,
            amount: requestsData
                .filter((r) => r.status === "rejected")
                .reduce((sum, r) => sum + Number(r.amount), 0),
        },
    };
    // إحصائيات المعاملات (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let transactionsConditions = [
        (0, drizzle_orm_1.sql) `${schema_1.walletTransactions.createdAt} >= ${thirtyDaysAgo}`,
    ];
    if (organizationId) {
        transactionsConditions.push((0, drizzle_orm_1.eq)(schema_1.walletTransactions.organizationId, organizationId));
    }
    const transactionsData = await db_1.db
        .select({
        type: schema_1.walletTransactions.type,
        amount: schema_1.walletTransactions.amount,
    })
        .from(schema_1.walletTransactions)
        .where((0, drizzle_orm_1.and)(...transactionsConditions));
    const transactionsStats = {
        recharge: {
            count: transactionsData.filter((t) => t.type === "recharge").length,
            amount: transactionsData
                .filter((t) => t.type === "recharge")
                .reduce((sum, t) => sum + Number(t.amount), 0),
        },
        purchase: {
            count: transactionsData.filter((t) => t.type === "purchase").length,
            amount: transactionsData
                .filter((t) => t.type === "purchase")
                .reduce((sum, t) => sum + Number(t.amount), 0),
        },
    };
    (0, response_1.SuccessResponse)(res, {
        balance: {
            totalBalance,
            studentsWithBalance,
            totalStudents: studentsData.length,
        },
        requests: requestsStats,
        transactions: {
            last30Days: transactionsStats,
        },
    }, 200);
};
exports.getWalletStats = getWalletStats;
