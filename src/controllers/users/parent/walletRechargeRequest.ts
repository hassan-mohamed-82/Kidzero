// src/controllers/users/parent/wallet.ts

import { Request, Response } from "express";
import { db } from "../../../models/db";
import {
    students,
    walletRechargeRequests,
    walletTransactions,
    paymentMethod,
    organizations,
} from "../../../models/schema";
import { eq, and, desc } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";
import { BadRequest } from "../../../Errors/BadRequest";
import { saveBase64Image } from "../../../utils/handleImages";
import { v4 as uuidv4 } from "uuid";

// ✅ جلب طرق الدفع المتاحة
export const getWalletSelection = async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new BadRequest("Parent authentication required");
  }

  // جلب أولاد الـ Parent مع رصيد المحفظة
  const children = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      walletBalance: students.walletBalance,
      organizationId: students.organizationId,
      organizationName: organizations.name,
      organizationLogo: organizations.logo,
    })
    .from(students)
    .leftJoin(organizations, eq(students.organizationId, organizations.id))
    .where(eq(students.parentId, parentId));

  // جلب طرق الدفع المتاحة
  const methods = await db
    .select({
      id: paymentMethod.id,
      name: paymentMethod.name,
      logo: paymentMethod.logo,
      description: paymentMethod.description,
    })
    .from(paymentMethod)
    .where(eq(paymentMethod.isActive, true));

  SuccessResponse(
    res,
    {
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
    },
    200
  );
};
// ✅ طلب شحن المحفظة
export const requestRecharge = async (req: Request, res: Response) => {
    const parentId = req.user?.id;
    const { studentId, amount, paymentMethodId, proofImage, notes } = req.body;

    if (!parentId) {
        throw new BadRequest("Parent authentication required");
    }

    if (!studentId) {
        throw new BadRequest("Student ID is required");
    }

    if (!amount || amount <= 0) {
        throw new BadRequest("Valid amount is required");
    }

    if (!paymentMethodId) {
        throw new BadRequest("Payment method is required");
    }

    // التحقق من طريقة الدفع
    const [method] = await db
        .select()
        .from(paymentMethod)
        .where(
            and(
                eq(paymentMethod.id, paymentMethodId),
                eq(paymentMethod.isActive, true)
            )
        )
        .limit(1);

    if (!method) {
        throw new NotFound("Payment method not found");
    }

    // التحقق أن الطالب ابن الـ Parent
    const [student] = await db
        .select({
            id: students.id,
            name: students.name,
            organizationId: students.organizationId,
            walletBalance: students.walletBalance,
        })
        .from(students)
        .where(and(eq(students.id, studentId), eq(students.parentId, parentId)))
        .limit(1);

    if (!student) {
        throw new NotFound("Student not found");
    }

    const requestId = uuidv4();

    // حفظ صورة إثبات الدفع
    let proofImageUrl = null;
    if (proofImage) {
        const result = await saveBase64Image(
            req,
            proofImage,
            `wallet-proofs/${requestId}`
        );
        proofImageUrl = result.url;
    }

    // إنشاء طلب الشحن
    await db.insert(walletRechargeRequests).values({
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

    SuccessResponse(
        res,
        {
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
        },
        201
    );
};

// ✅ جلب طلبات الشحن الخاصة بي
export const getMyRechargeRequests = async (req: Request, res: Response) => {
    const parentId = req.user?.id;
    const { status, studentId} = req.query;

    if (!parentId) {
        throw new BadRequest("Parent authentication required");
    }


    let conditions: any = eq(walletRechargeRequests.parentId, parentId);

    if (status && status !== "all") {
        conditions = and(
            conditions,
            eq(walletRechargeRequests.status, status as "pending" | "approved" | "rejected")
        );
    }

    if (studentId) {
        conditions = and(
            conditions,
            eq(walletRechargeRequests.studentId, studentId as string)
        );
    }

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
            // Payment Method
            paymentMethodId: paymentMethod.id,
            paymentMethodName: paymentMethod.name,
            paymentMethodLogo: paymentMethod.logo,
            // Organization
            organizationName: organizations.name,
        })
        .from(walletRechargeRequests)
        .innerJoin(students, eq(walletRechargeRequests.studentId, students.id))
        .innerJoin(
            paymentMethod,
            eq(walletRechargeRequests.paymentMethodId, paymentMethod.id)
        )
        .innerJoin(
            organizations,
            eq(walletRechargeRequests.organizationId, organizations.id)
        )
        .where(conditions)
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
        },
        paymentMethod: {
            id: r.paymentMethodId,
            name: r.paymentMethodName,
            logo: r.paymentMethodLogo,
        },
        organization: r.organizationName,
    }));

    // إحصائيات
    const allRequests = await db
        .select({ status: walletRechargeRequests.status })
        .from(walletRechargeRequests)
        .where(eq(walletRechargeRequests.parentId, parentId));

    const stats = {
        total: allRequests.length,
        pending: allRequests.filter((r) => r.status === "pending").length,
        approved: allRequests.filter((r) => r.status === "approved").length,
        rejected: allRequests.filter((r) => r.status === "rejected").length,
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

// ✅ جلب محفظة الطفل مع المعاملات
export const getChildWallet = async (req: Request, res: Response) => {
    const parentId = req.user?.id;
    const { childId } = req.params;

    if (!parentId) {
        throw new BadRequest("Parent authentication required");
    }

    const [student] = await db
        .select({
            id: students.id,
            name: students.name,
            avatar: students.avatar,
            walletBalance: students.walletBalance,
            organizationName: organizations.name,
        })
        .from(students)
        .leftJoin(organizations, eq(students.organizationId, organizations.id))
        .where(and(eq(students.id, childId), eq(students.parentId, parentId)))
        .limit(1);

    if (!student) {
        throw new NotFound("Student not found");
    }


    // المعاملات
    const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.studentId, childId))
        .orderBy(desc(walletTransactions.createdAt))


    // الطلبات المعلقة
    const pendingRequests = await db
        .select({
            id: walletRechargeRequests.id,
            amount: walletRechargeRequests.amount,
            createdAt: walletRechargeRequests.createdAt,
            paymentMethodName: paymentMethod.name,
            paymentMethodLogo: paymentMethod.logo,
        })
        .from(walletRechargeRequests)
        .innerJoin(
            paymentMethod,
            eq(walletRechargeRequests.paymentMethodId, paymentMethod.id)
        )
        .where(
            and(
                eq(walletRechargeRequests.studentId, childId),
                eq(walletRechargeRequests.status, "pending")
            )
        )
        .orderBy(desc(walletRechargeRequests.createdAt));

    SuccessResponse(
        res,
        {
            student: {
                id: student.id,
                name: student.name,
                avatar: student.avatar,
                organization: student.organizationName,
            },
            wallet: {
                balance: Number(student.walletBalance) || 0,
                pendingAmount: pendingRequests.reduce(
                    (sum, r) => sum + Number(r.amount),
                    0
                ),
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

        },
        200
    );
};
