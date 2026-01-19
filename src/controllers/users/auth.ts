// src/controllers/mobile/authController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { drivers, codrivers, parents, students } from "../../models/schema";
import { eq, or } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { UnauthorizedError } from "../../Errors";
import bcrypt from "bcrypt";
import {
  generateDriverToken,
  generateCoDriverToken,
  generateParentToken,
} from "../../utils/auth";
import { emailVerifications } from "../../models/admin/emailverfication";
import { v4 as uuidv4 } from "uuid";
import { randomInt } from "crypto";
import { sendEmail } from "../../utils/sendEmails";
// ✅ Parent Login (Parent App) - يدعم الدخول بالهاتف أو الإيميل
export const parentLogin = async (req: Request, res: Response) => {
  const { identifier, password } = req.body; // identifier = phone OR email

  if (!identifier || !password) {
    throw new BadRequest("البريد الإلكتروني/رقم الهاتف وكلمة المرور مطلوبان");
  }

  // البحث بالهاتف أو الإيميل
  const parent = await db
    .select()
    .from(parents)
    .where(or(eq(parents.phone, identifier), eq(parents.email, identifier.toLowerCase())))
    .limit(1);

  if (!parent[0]) {
    throw new UnauthorizedError("بيانات الدخول غير صحيحة");
  }

  if (parent[0].status === "inactive") {
    throw new UnauthorizedError("حسابك غير نشط. يرجى التواصل مع الإدارة.");
  }

  if (!parent[0].isVerified) {
    throw new UnauthorizedError("الحساب غير مفعل. يرجى التحقق من البريد الإلكتروني.");
  }

  const isValidPassword = await bcrypt.compare(password, parent[0].password);
  if (!isValidPassword) {
    throw new UnauthorizedError("بيانات الدخول غير صحيحة");
  }

  // جلب الأبناء
  const children = await db
    .select({
      id: students.id,
      name: students.name,
      avatar: students.avatar,
      grade: students.grade,
      classroom: students.classroom,
    })
    .from(students)
    .where(eq(students.parentId, parent[0].id));

  const token = generateParentToken({
    id: parent[0].id,
    name: parent[0].name,
    email: parent[0].email,
    phone: parent[0].phone,
  });

  return SuccessResponse(
    res,
    {
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: {
        id: parent[0].id,
        name: parent[0].name,
        email: parent[0].email,
        phone: parent[0].phone,
        avatar: parent[0].avatar,
        address: parent[0].address,
        role: "parent",
        children,
      },
    },
    200
  );
};

// ✅ Driver/CoDriver Login (Driver App) - يدعم الدخول بالهاتف أو الإيميل
export const driverAppLogin = async (req: Request, res: Response) => {
  const { identifier, password } = req.body; // identifier = phone OR email

  if (!identifier || !password) {
    throw new BadRequest("البريد الإلكتروني/رقم الهاتف وكلمة المرور مطلوبان");
  }

  // 1. البحث في جدول الـ Drivers بالهاتف أو الإيميل
  const driver = await db
    .select()
    .from(drivers)
    .where(or(eq(drivers.phone, identifier), eq(drivers.email, identifier.toLowerCase())))
    .limit(1);

  if (driver[0]) {
    if (driver[0].status === "inactive") {
      throw new UnauthorizedError("حسابك غير نشط. يرجى التواصل مع الإدارة.");
    }

    const isValidPassword = await bcrypt.compare(password, driver[0].password);
    if (!isValidPassword) {
      throw new UnauthorizedError("بيانات الدخول غير صحيحة");
    }

    const token = generateDriverToken({
      id: driver[0].id,
      email: driver[0].email ?? undefined,
      name: driver[0].name,
      organizationId: driver[0].organizationId,
    });

    return SuccessResponse(
      res,
      {
        message: "تم تسجيل الدخول بنجاح",
        token,
        user: {
          id: driver[0].id,
          name: driver[0].name,
          email: driver[0].email,
          phone: driver[0].phone,
          avatar: driver[0].avatar,
          role: "driver",
        },
      },
      200
    );
  }

  // 2. البحث في جدول الـ CoDrivers بالهاتف أو الإيميل
  const codriver = await db
    .select()
    .from(codrivers)
    .where(or(eq(codrivers.phone, identifier), eq(codrivers.email, identifier.toLowerCase())))
    .limit(1);

  if (codriver[0]) {
    if (codriver[0].status === "inactive") {
      throw new UnauthorizedError("حسابك غير نشط. يرجى التواصل مع الإدارة.");
    }

    const isValidPassword = await bcrypt.compare(password, codriver[0].password);
    if (!isValidPassword) {
      throw new UnauthorizedError("بيانات الدخول غير صحيحة");
    }

    const token = generateCoDriverToken({
      id: codriver[0].id,
      email: codriver[0].email ?? undefined,
      name: codriver[0].name,
      organizationId: codriver[0].organizationId,
    });

    return SuccessResponse(
      res,
      {
        message: "تم تسجيل الدخول بنجاح",
        token,
        user: {
          id: codriver[0].id,
          name: codriver[0].name,
          email: codriver[0].email,
          phone: codriver[0].phone,
          avatar: codriver[0].avatar,
          role: "codriver",
        },
      },
      200
    );
  }

  throw new UnauthorizedError("بيانات الدخول غير صحيحة");
};



// ================== Signup ==================

export const signup = async (req: Request, res: Response) => {
  const { name, email, phone, password, nationalId } = req.body;

  if (!name || !email || !phone || !password) {
    throw new BadRequest("جميع الحقول مطلوبة");
  }

  if (password.length < 8) {
    throw new BadRequest("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check existing
  const [existing] = await db
    .select()
    .from(parents)
    .where(or(eq(parents.email, normalizedEmail), eq(parents.phone, phone)))
    .limit(1);

  if (existing) {
    if (existing.isVerified) {
      if (existing.email === normalizedEmail) {
        throw new BadRequest("البريد الإلكتروني مستخدم بالفعل");
      }
      if (existing.phone === phone) {
        throw new BadRequest("رقم الهاتف مستخدم بالفعل");
      }
    }

    // Update unverified account
    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .update(parents)
      .set({
        name,
        phone,
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(parents.id, existing.id));

    // Delete old codes & send new
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.parentId, existing.id));

    const code = randomInt(100000, 999999).toString();

    await db.insert(emailVerifications).values({
      id: uuidv4(),
      parentId: existing.id,
      code,
    });

    await sendEmail(
      normalizedEmail,
      "رمز التحقق - Kidsero",
      `رمز التحقق الخاص بك هو: ${code}`
    );

    return SuccessResponse(
      res,
      {
        message: "تم تحديث بياناتك وإرسال رمز تحقق جديد",
        parentId: existing.id,
      },
      200
    );
  }

  // Create new account
  const hashedPassword = await bcrypt.hash(password, 10);
  const parentId = uuidv4();
  const code = randomInt(100000, 999999).toString();

  await db.insert(parents).values({
    id: parentId,
    name,
    email: normalizedEmail,
    phone,
    nationalId: nationalId || null,
    password: hashedPassword,
    isVerified: false,
    status: "active",
  });

  await db.insert(emailVerifications).values({
    id: uuidv4(),
    parentId,
    code,
  });

  await sendEmail(
    normalizedEmail,
    "رمز التحقق - Kidsero",
    `مرحباً ${name}!\n\nرمز التحقق الخاص بك هو: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق.`
  );

  return SuccessResponse(
    res,
    {
      message: "تم التسجيل بنجاح. تم إرسال رمز التحقق إلى بريدك الإلكتروني",
      parentId,
    },
    201
  );
};

// ================== Verify Email ==================

export const verifyEmail = async (req: Request, res: Response) => {
  const { parentId, code } = req.body;

  if (!parentId || !code) {
    throw new BadRequest("معرف المستخدم ورمز التحقق مطلوبان");
  }

  const [parent] = await db
    .select()
    .from(parents)
    .where(eq(parents.id, parentId))
    .limit(1);

  if (!parent) {
    throw new NotFound("الحساب غير موجود");
  }

  if (parent.isVerified) {
    throw new BadRequest("تم التحقق من الحساب مسبقاً");
  }

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.parentId, parentId))
    .limit(1);

  if (!record || record.code !== code) {
    throw new BadRequest("رمز التحقق غير صحيح");
  }

  // Verify
  await db
    .update(parents)
    .set({ isVerified: true })
    .where(eq(parents.id, parentId));

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.parentId, parentId));

  // Generate token
  const token = generateParentToken({
    id: parent.id,
    name: parent.name,
    phone: parent.phone,
    email: parent.email,
  });

  return SuccessResponse(
    res,
    {
      message: "تم التحقق من البريد الإلكتروني بنجاح",
      token,
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
      },
    },
    200
  );
};

// ================== Resend Verification Code ==================

// export const resendVerificationCode = async (req: Request, res: Response) => {
//   const { email } = req.body;

//   if (!email) {
//     throw new BadRequest("البريد الإلكتروني مطلوب");
//   }

//   const normalizedEmail = email.trim().toLowerCase();

//   const [parent] = await db
//     .select()
//     .from(parents)
//     .where(eq(parents.email, normalizedEmail))
//     .limit(1);

//   if (!parent) {
//     throw new NotFound("الحساب غير موجود");
//   }

//   if (parent.isVerified) {
//     throw new BadRequest("تم التحقق من البريد الإلكتروني بالفعل");
//   }

//   await db
//     .delete(emailVerifications)
//     .where(eq(emailVerifications.parentId, parent.id));

//   const code = randomInt(100000, 999999).toString();

//   await db.insert(emailVerifications).values({
//     id: uuidv4(),
//     parentId: parent.id,
//     code,
//   });

//   await sendEmail(
//     normalizedEmail,
//     "رمز التحقق - Kidsero",
//     `رمز التحقق الجديد الخاص بك هو: ${code}`
//   );

//   return SuccessResponse(
//     res,
//     {
//       message: "تم إرسال رمز تحقق جديد",
//       parentId: parent.id,
//     },
//     200
//   );
// };


export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequest("البريد الإلكتروني مطلوب");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [parent] = await db
    .select()
    .from(parents)
    .where(eq(parents.email, normalizedEmail))
    .limit(1);

  if (!parent) {
    return SuccessResponse(
      res,
      { message: "إذا كان البريد مسجلاً، سيتم إرسال رمز إعادة التعيين" },
      200
    );
  }

  if (!parent.isVerified) {
    throw new BadRequest("الحساب غير مفعل");
  }

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.parentId, parent.id));

  const code = randomInt(100000, 999999).toString();

  await db.insert(emailVerifications).values({
    id: uuidv4(),
    parentId: parent.id,
    code,
  });

  await sendEmail(
    normalizedEmail,
    "إعادة تعيين كلمة المرور - Kidsero",
    `رمز إعادة تعيين كلمة المرور: ${code}\n\nصالح لمدة ساعة.`
  );

  return SuccessResponse(
    res,
    {
      message: "تم إرسال رمز إعادة التعيين",
      parentId: parent.id,
    },
    200
  );
};

// ================== Verify Reset Code ==================

export const verifyResetCode = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new BadRequest("البريد الإلكتروني ورمز التحقق مطلوبان");
  }

  const [parent] = await db
    .select()
    .from(parents)
    .where(eq(parents.email, email.trim().toLowerCase()))
    .limit(1);

  if (!parent) {
    throw new NotFound("الحساب غير موجود");
  }

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.parentId, parent.id))
    .limit(1);

  if (!record || record.code !== code) {
    throw new BadRequest("رمز التحقق غير صحيح");
  }

  return SuccessResponse(
    res,
    {
      message: "تم التحقق من الرمز",
      parentId: parent.id,
    },
    200
  );
};

// ================== Reset Password ==================

export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    throw new BadRequest("جميع الحقول مطلوبة");
  }

  if (newPassword.length < 8) {
    throw new BadRequest("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  const [parent] = await db
    .select()
    .from(parents)
    .where(eq(parents.email, email.trim().toLowerCase()))
    .limit(1);

  if (!parent) {
    throw new NotFound("الحساب غير موجود");
  }

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.parentId, parent.id))
    .limit(1);

  if (!record || record.code !== code) {
    throw new BadRequest("رمز التحقق غير صحيح");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(parents)
    .set({ password: hashedPassword })
    .where(eq(parents.id, parent.id));

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.parentId, parent.id));

  return SuccessResponse(res, { message: "تم تغيير كلمة المرور بنجاح" }, 200);
};

// ================== Update FCM Token ==================

export const updateFcmToken = async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { fcmToken } = req.body;

  if (!parentId) {
    throw new UnauthorizedError("غير مصرح");
  }

  if (!fcmToken) {
    throw new BadRequest("FCM Token مطلوب");
  }

  await db
    .update(parents)
    .set({ fcmTokens: fcmToken })
    .where(eq(parents.id, parentId));

  return SuccessResponse(res, { message: "تم تحديث FCM Token" }, 200);
};
