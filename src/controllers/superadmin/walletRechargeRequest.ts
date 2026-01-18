// src/controllers/superAdmin/walletController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import {
  students,
  walletRechargeRequests,
  walletTransactions,
  paymentMethod,
  organizations,
  parents,
} from "../../models/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { v4 as uuidv4 } from "uuid";

// ✅ جلب كل طلبات الشحن
export const getAllRechargeRequests = async (req: Request, res: Response) => {
  const { status, organizationId } = req.query;


  // بناء الشروط
  let conditions: any[] = [];

  if (status && status !== "all") {
    conditions.push(eq(walletRechargeRequests.status, status as "pending" | "approved" | "rejected"));
  }

  if (organizationId) {
    conditions.push(eq(walletRechargeRequests.organizationId, organizationId as string));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const requests = await db
    .select({
      id: walletRechargeRequests.id,
      amount: walletRechargeRequests.amount,
      proofImage: walletRechargeRequests.proofImage,
      status: walletRechargeRequests.status,
      notes: walletRechargeRequests.notes,
      createdAt: walletRechargeRequests.createdAt,
      reviewedAt: walletRechargeRequests.reviewedAt,
      // Student
      studentId: students.id,
      studentName: students.name,
      studentAvatar: students.avatar,
      studentBalance: students.walletBalance,
      // Parent
      parentId: parents.id,
      parentName: parents.name,
      parentPhone: parents.phone,
      // Payment Method
      paymentMethodId: paymentMethod.id,
      paymentMethodName: paymentMethod.name,
      paymentMethodLogo: paymentMethod.logo,
      // Organization
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationLogo: organizations.logo,
    })
    .from(walletRechargeRequests)
    .innerJoin(students, eq(walletRechargeRequests.studentId, students.id))
    .innerJoin(parents, eq(walletRechargeRequests.parentId, parents.id))
    .innerJoin(paymentMethod, eq(walletRechargeRequests.paymentMethodId, paymentMethod.id))
    .innerJoin(organizations, eq(walletRechargeRequests.organizationId, organizations.id))
    .where(whereClause)
    .orderBy(desc(walletRechargeRequests.createdAt))
    
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
  const allStats = await db
    .select({
      status: walletRechargeRequests.status,
      amount: walletRechargeRequests.amount,
    })
    .from(walletRechargeRequests);

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

  SuccessResponse(
    res,
    {
      requests: formattedRequests,
      stats,
  
    },
    200
  );
};

// ✅ جلب طلب شحن بالتفصيل
export const getRechargeRequestById = async (req: Request, res: Response) => {
  const { requestId } = req.params;

  const [request] = await db
    .select({
      id: walletRechargeRequests.id,
      amount: walletRechargeRequests.amount,
      proofImage: walletRechargeRequests.proofImage,
      status: walletRechargeRequests.status,
      notes: walletRechargeRequests.notes,
      createdAt: walletRechargeRequests.createdAt,
      reviewedAt: walletRechargeRequests.reviewedAt,
      // Student
      studentId: students.id,
      studentName: students.name,
      studentAvatar: students.avatar,
      studentBalance: students.walletBalance,
      studentGrade: students.grade,
      studentClassroom: students.classroom,
      // Parent
      parentId: parents.id,
      parentName: parents.name,
      parentPhone: parents.phone,
      parentEmail: parents.email,
      // Payment Method
      paymentMethodId: paymentMethod.id,
      paymentMethodName: paymentMethod.name,
      paymentMethodLogo: paymentMethod.logo,
      // Organization
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationLogo: organizations.logo,
    })
    .from(walletRechargeRequests)
    .innerJoin(students, eq(walletRechargeRequests.studentId, students.id))
    .innerJoin(parents, eq(walletRechargeRequests.parentId, parents.id))
    .innerJoin(paymentMethod, eq(walletRechargeRequests.paymentMethodId, paymentMethod.id))
    .innerJoin(organizations, eq(walletRechargeRequests.organizationId, organizations.id))
    .where(eq(walletRechargeRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new NotFound("Request not found");
  }

  // جلب آخر معاملات الطالب
  const recentTransactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.studentId, request.studentId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(10);

  SuccessResponse(
    res,
    {
      request: {
        id: request.id,
        amount: Number(request.amount),
        proofImage: request.proofImage,
        status: request.status,
        notes: request.notes,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt,
      },
      student: {
        id: request.studentId,
        name: request.studentName,
        avatar: request.studentAvatar,
        grade: request.studentGrade,
        classroom: request.studentClassroom,
        currentBalance: Number(request.studentBalance) || 0,
      },
      parent: {
        id: request.parentId,
        name: request.parentName,
        phone: request.parentPhone,
        email: request.parentEmail,
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
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        description: t.description,
        createdAt: t.createdAt,
      })),
    },
    200
  );
};

// ✅ الموافقة على طلب الشحن
export const approveRechargeRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;

  // جلب الطلب
  const [request] = await db
    .select({
      id: walletRechargeRequests.id,
      studentId: walletRechargeRequests.studentId,
      organizationId: walletRechargeRequests.organizationId,
      amount: walletRechargeRequests.amount,
      status: walletRechargeRequests.status,
      paymentMethodName: paymentMethod.name,
    })
    .from(walletRechargeRequests)
    .innerJoin(paymentMethod, eq(walletRechargeRequests.paymentMethodId, paymentMethod.id))
    .where(eq(walletRechargeRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new NotFound("Request not found");
  }

  if (request.status !== "pending") {
    throw new BadRequest(`الطلب ${request.status === "approved" ? "تمت الموافقة عليه" : "مرفوض"} بالفعل`);
  }

  // جلب رصيد الطالب الحالي
  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      walletBalance: students.walletBalance,
    })
    .from(students)
    .where(eq(students.id, request.studentId))
    .limit(1);

  if (!student) {
    throw new NotFound("Student not found");
  }

  const currentBalance = Number(student.walletBalance) || 0;
  const rechargeAmount = Number(request.amount);
  const newBalance = currentBalance + rechargeAmount;

  // Transaction
  await db.transaction(async (tx) => {
    // 1) تحديث رصيد الطالب
    await tx
      .update(students)
      .set({ walletBalance: newBalance.toString() })
      .where(eq(students.id, request.studentId));

    // 2) تسجيل المعاملة
    await tx.insert(walletTransactions).values({
      id: uuidv4(),
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
      .update(walletRechargeRequests)
      .set({
        status: "approved",
        reviewedAt: new Date(),
      })
      .where(eq(walletRechargeRequests.id, requestId));
  });

  // TODO: إرسال إشعار لولي الأمر

  SuccessResponse(
    res,
    {
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
    },
    200
  );
};

// ✅ رفض طلب الشحن
export const rejectRechargeRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { reason } = req.body;

  // جلب الطلب
  const [request] = await db
    .select()
    .from(walletRechargeRequests)
    .where(eq(walletRechargeRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new NotFound("Request not found");
  }

  if (request.status !== "pending") {
    throw new BadRequest(`الطلب ${request.status === "approved" ? "تمت الموافقة عليه" : "مرفوض"} بالفعل`);
  }

  // تحديث حالة الطلب
  await db
    .update(walletRechargeRequests)
    .set({
      status: "rejected",
      notes: reason || null,
      reviewedAt: new Date(),
    })
    .where(eq(walletRechargeRequests.id, requestId));

  // TODO: إرسال إشعار لولي الأمر بسبب الرفض

  SuccessResponse(
    res,
    {
      message: "تم رفض طلب الشحن",
      request: {
        id: requestId,
        status: "rejected",
        reason: reason || null,
      },
    },
    200
  );
};

// ✅ إحصائيات المحافظ
export const getWalletStats = async (req: Request, res: Response) => {
  const { organizationId } = req.query;

  // إجمالي الأرصدة
  let balanceCondition = organizationId
    ? eq(students.organizationId, organizationId as string)
    : undefined;

  const studentsData = await db
    .select({
      walletBalance: students.walletBalance,
    })
    .from(students)
    .where(balanceCondition);

  const totalBalance = studentsData.reduce(
    (sum, s) => sum + (Number(s.walletBalance) || 0),
    0
  );
  const studentsWithBalance = studentsData.filter(
    (s) => Number(s.walletBalance) > 0
  ).length;

  // إحصائيات الطلبات
  let requestsCondition = organizationId
    ? eq(walletRechargeRequests.organizationId, organizationId as string)
    : undefined;

  const requestsData = await db
    .select({
      status: walletRechargeRequests.status,
      amount: walletRechargeRequests.amount,
    })
    .from(walletRechargeRequests)
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

  let transactionsConditions: any[] = [
    sql`${walletTransactions.createdAt} >= ${thirtyDaysAgo}`,
  ];

  if (organizationId) {
    transactionsConditions.push(
      eq(walletTransactions.organizationId, organizationId as string)
    );
  }

  const transactionsData = await db
    .select({
      type: walletTransactions.type,
      amount: walletTransactions.amount,
    })
    .from(walletTransactions)
    .where(and(...transactionsConditions));

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

  SuccessResponse(
    res,
    {
      balance: {
        totalBalance,
        studentsWithBalance,
        totalStudents: studentsData.length,
      },
      requests: requestsStats,
      transactions: {
        last30Days: transactionsStats,
      },
    },
    200
  );
};
