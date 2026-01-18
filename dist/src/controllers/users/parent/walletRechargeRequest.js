"use strict";
// src/controllers/users/parent/wallet.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildWallet = exports.getMyRechargeRequests = exports.requestRecharge = exports.getWalletSelection = void 0;
const db_1 = require("../../../models/db");
const schema_1 = require("../../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const NotFound_1 = require("../../../Errors/NotFound");
const BadRequest_1 = require("../../../Errors/BadRequest");
const handleImages_1 = require("../../../utils/handleImages");
const uuid_1 = require("uuid");
// ✅ جلب طرق الدفع المتاحة
const getWalletSelection = async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    // جلب أولاد الـ Parent مع رصيد المحفظة
    const children = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        walletBalance: schema_1.students.walletBalance,
        organizationId: schema_1.students.organizationId,
        organizationName: schema_1.organizations.name,
        organizationLogo: schema_1.organizations.logo,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.students.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId));
    // جلب طرق الدفع المتاحة
    const methods = await db_1.db
        .select({
        id: schema_1.paymentMethod.id,
        name: schema_1.paymentMethod.name,
        logo: schema_1.paymentMethod.logo,
        description: schema_1.paymentMethod.description,
    })
        .from(schema_1.paymentMethod)
        .where((0, drizzle_orm_1.eq)(schema_1.paymentMethod.isActive, true));
    (0, response_1.SuccessResponse)(res, {
        children: children.map((c) => ({
            id: c.id,
            name: c.name,
            avatar: c.avatar,
            grade: c.grade,
            wallet: {
                balance: Number(c.walletBalance) || 0,
            },
            organization: {
                id: c.organizationId,
                name: c.organizationName,
                logo: c.organizationLogo,
            },
        })),
        paymentMethods: methods,
    }, 200);
};
exports.getWalletSelection = getWalletSelection;
// ✅ طلب شحن المحفظة
const requestRecharge = async (req, res) => {
    const parentId = req.user?.id;
    const { studentId, amount, paymentMethodId, proofImage, notes } = req.body;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    if (!studentId) {
        throw new BadRequest_1.BadRequest("Student ID is required");
    }
    if (!amount || amount <= 0) {
        throw new BadRequest_1.BadRequest("Valid amount is required");
    }
    if (!paymentMethodId) {
        throw new BadRequest_1.BadRequest("Payment method is required");
    }
    // التحقق من طريقة الدفع
    const [method] = await db_1.db
        .select()
        .from(schema_1.paymentMethod)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, paymentMethodId), (0, drizzle_orm_1.eq)(schema_1.paymentMethod.isActive, true)))
        .limit(1);
    if (!method) {
        throw new NotFound_1.NotFound("Payment method not found");
    }
    // التحقق أن الطالب ابن الـ Parent
    const [student] = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        organizationId: schema_1.students.organizationId,
        walletBalance: schema_1.students.walletBalance,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, studentId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!student) {
        throw new NotFound_1.NotFound("Student not found");
    }
    const requestId = (0, uuid_1.v4)();
    // حفظ صورة إثبات الدفع
    let proofImageUrl = null;
    if (proofImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, proofImage, `wallet-proofs/${requestId}`);
        proofImageUrl = result.url;
    }
    // إنشاء طلب الشحن
    await db_1.db.insert(schema_1.walletRechargeRequests).values({
        id: requestId,
        organizationId: student.organizationId,
        parentId,
        studentId,
        amount: amount.toString(),
        paymentMethodId,
        proofImage: proofImageUrl,
        notes: notes || null,
        status: "pending",
    });
    (0, response_1.SuccessResponse)(res, {
        message: "تم إرسال طلب الشحن بنجاح، في انتظار الموافقة",
        request: {
            id: requestId,
            student: {
                id: studentId,
                name: student.name,
            },
            amount: Number(amount),
            paymentMethod: {
                id: method.id,
                name: method.name,
            },
            status: "pending",
            currentBalance: Number(student.walletBalance) || 0,
        },
    }, 201);
};
exports.requestRecharge = requestRecharge;
// ✅ جلب طلبات الشحن الخاصة بي
const getMyRechargeRequests = async (req, res) => {
    const parentId = req.user?.id;
    const { status, studentId } = req.query;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    let conditions = (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.parentId, parentId);
    if (status && status !== "all") {
        conditions = (0, drizzle_orm_1.and)(conditions, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.status, status));
    }
    if (studentId) {
        conditions = (0, drizzle_orm_1.and)(conditions, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.studentId, studentId));
    }
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
        // Payment Method
        paymentMethodId: schema_1.paymentMethod.id,
        paymentMethodName: schema_1.paymentMethod.name,
        paymentMethodLogo: schema_1.paymentMethod.logo,
        // Organization
        organizationName: schema_1.organizations.name,
    })
        .from(schema_1.walletRechargeRequests)
        .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.studentId, schema_1.students.id))
        .innerJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.paymentMethodId, schema_1.paymentMethod.id))
        .innerJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.organizationId, schema_1.organizations.id))
        .where(conditions)
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
        },
        paymentMethod: {
            id: r.paymentMethodId,
            name: r.paymentMethodName,
            logo: r.paymentMethodLogo,
        },
        organization: r.organizationName,
    }));
    // إحصائيات
    const allRequests = await db_1.db
        .select({ status: schema_1.walletRechargeRequests.status })
        .from(schema_1.walletRechargeRequests)
        .where((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.parentId, parentId));
    const stats = {
        total: allRequests.length,
        pending: allRequests.filter((r) => r.status === "pending").length,
        approved: allRequests.filter((r) => r.status === "approved").length,
        rejected: allRequests.filter((r) => r.status === "rejected").length,
    };
    (0, response_1.SuccessResponse)(res, {
        requests: formattedRequests,
        stats,
    }, 200);
};
exports.getMyRechargeRequests = getMyRechargeRequests;
// ✅ جلب محفظة الطفل مع المعاملات
const getChildWallet = async (req, res) => {
    const parentId = req.user?.id;
    const { childId } = req.params;
    if (!parentId) {
        throw new BadRequest_1.BadRequest("Parent authentication required");
    }
    const [student] = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        walletBalance: schema_1.students.walletBalance,
        organizationName: schema_1.organizations.name,
    })
        .from(schema_1.students)
        .leftJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.students.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, childId), (0, drizzle_orm_1.eq)(schema_1.students.parentId, parentId)))
        .limit(1);
    if (!student) {
        throw new NotFound_1.NotFound("Student not found");
    }
    // المعاملات
    const transactions = await db_1.db
        .select()
        .from(schema_1.walletTransactions)
        .where((0, drizzle_orm_1.eq)(schema_1.walletTransactions.studentId, childId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.walletTransactions.createdAt));
    // الطلبات المعلقة
    const pendingRequests = await db_1.db
        .select({
        id: schema_1.walletRechargeRequests.id,
        amount: schema_1.walletRechargeRequests.amount,
        createdAt: schema_1.walletRechargeRequests.createdAt,
        paymentMethodName: schema_1.paymentMethod.name,
        paymentMethodLogo: schema_1.paymentMethod.logo,
    })
        .from(schema_1.walletRechargeRequests)
        .innerJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.paymentMethodId, schema_1.paymentMethod.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.studentId, childId), (0, drizzle_orm_1.eq)(schema_1.walletRechargeRequests.status, "pending")))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.walletRechargeRequests.createdAt));
    (0, response_1.SuccessResponse)(res, {
        student: {
            id: student.id,
            name: student.name,
            avatar: student.avatar,
            organization: student.organizationName,
        },
        wallet: {
            balance: Number(student.walletBalance) || 0,
            pendingAmount: pendingRequests.reduce((sum, r) => sum + Number(r.amount), 0),
        },
        pendingRequests: pendingRequests.map((r) => ({
            id: r.id,
            amount: Number(r.amount),
            paymentMethod: {
                name: r.paymentMethodName,
                logo: r.paymentMethodLogo,
            },
            createdAt: r.createdAt,
        })),
        transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            balanceBefore: Number(t.balanceBefore),
            balanceAfter: Number(t.balanceAfter),
            description: t.description,
            createdAt: t.createdAt,
        })),
    }, 200);
};
exports.getChildWallet = getChildWallet;
