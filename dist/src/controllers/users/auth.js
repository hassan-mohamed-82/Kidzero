"use strict";
// src/controllers/mobile/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmToken = exports.resetPassword = exports.verifyResetCode = exports.forgotPassword = exports.verifyEmail = exports.signup = exports.driverAppLogin = exports.parentLogin = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const Errors_1 = require("../../Errors");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../utils/auth");
const emailverfication_1 = require("../../models/admin/emailverfication");
const uuid_1 = require("uuid");
const crypto_1 = require("crypto");
const sendEmails_1 = require("../../utils/sendEmails");
// ✅ Parent Login (Parent App) - يدعم الدخول بالهاتف أو الإيميل
const parentLogin = async (req, res) => {
    const { identifier, password } = req.body; // identifier = phone OR email
    if (!identifier || !password) {
        throw new BadRequest_1.BadRequest("البريد الإلكتروني/رقم الهاتف وكلمة المرور مطلوبان");
    }
    // البحث بالهاتف أو الإيميل
    const parent = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.parents.phone, identifier), (0, drizzle_orm_1.eq)(schema_1.parents.email, identifier.toLowerCase())))
        .limit(1);
    if (!parent[0]) {
        throw new Errors_1.UnauthorizedError("بيانات الدخول غير صحيحة");
    }
    if (parent[0].status === "inactive") {
        throw new Errors_1.UnauthorizedError("حسابك غير نشط. يرجى التواصل مع الإدارة.");
    }
    if (!parent[0].isVerified) {
        throw new Errors_1.UnauthorizedError("الحساب غير مفعل. يرجى التحقق من البريد الإلكتروني.");
    }
    const isValidPassword = await bcrypt_1.default.compare(password, parent[0].password);
    if (!isValidPassword) {
        throw new Errors_1.UnauthorizedError("بيانات الدخول غير صحيحة");
    }
    // جلب الأبناء
    const children = await db_1.db
        .select({
        id: schema_1.students.id,
        name: schema_1.students.name,
        avatar: schema_1.students.avatar,
        grade: schema_1.students.grade,
        classroom: schema_1.students.classroom,
    })
        .from(schema_1.students)
        .where((0, drizzle_orm_1.eq)(schema_1.students.parentId, parent[0].id));
    const token = (0, auth_1.generateParentToken)({
        id: parent[0].id,
        name: parent[0].name,
        email: parent[0].email,
        phone: parent[0].phone,
    });
    return (0, response_1.SuccessResponse)(res, {
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
    }, 200);
};
exports.parentLogin = parentLogin;
// ✅ Driver/CoDriver Login (Driver App) - يدعم الدخول بالهاتف أو الإيميل
const driverAppLogin = async (req, res) => {
    const { identifier, password } = req.body; // identifier = phone OR email
    if (!identifier || !password) {
        throw new BadRequest_1.BadRequest("البريد الإلكتروني/رقم الهاتف وكلمة المرور مطلوبان");
    }
    // 1. البحث في جدول الـ Drivers بالهاتف أو الإيميل
    const driver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.drivers.phone, identifier), (0, drizzle_orm_1.eq)(schema_1.drivers.email, identifier.toLowerCase())))
        .limit(1);
    if (driver[0]) {
        if (driver[0].status === "inactive") {
            throw new Errors_1.UnauthorizedError("حسابك غير نشط. يرجى التواصل مع الإدارة.");
        }
        const isValidPassword = await bcrypt_1.default.compare(password, driver[0].password);
        if (!isValidPassword) {
            throw new Errors_1.UnauthorizedError("بيانات الدخول غير صحيحة");
        }
        const token = (0, auth_1.generateDriverToken)({
            id: driver[0].id,
            email: driver[0].email ?? undefined,
            name: driver[0].name,
            organizationId: driver[0].organizationId,
        });
        return (0, response_1.SuccessResponse)(res, {
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
        }, 200);
    }
    // 2. البحث في جدول الـ CoDrivers بالهاتف أو الإيميل
    const codriver = await db_1.db
        .select()
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.codrivers.phone, identifier), (0, drizzle_orm_1.eq)(schema_1.codrivers.email, identifier.toLowerCase())))
        .limit(1);
    if (codriver[0]) {
        if (codriver[0].status === "inactive") {
            throw new Errors_1.UnauthorizedError("حسابك غير نشط. يرجى التواصل مع الإدارة.");
        }
        const isValidPassword = await bcrypt_1.default.compare(password, codriver[0].password);
        if (!isValidPassword) {
            throw new Errors_1.UnauthorizedError("بيانات الدخول غير صحيحة");
        }
        const token = (0, auth_1.generateCoDriverToken)({
            id: codriver[0].id,
            email: codriver[0].email ?? undefined,
            name: codriver[0].name,
            organizationId: codriver[0].organizationId,
        });
        return (0, response_1.SuccessResponse)(res, {
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
        }, 200);
    }
    throw new Errors_1.UnauthorizedError("بيانات الدخول غير صحيحة");
};
exports.driverAppLogin = driverAppLogin;
// ================== Signup ==================
const signup = async (req, res) => {
    const { name, email, phone, password, nationalId } = req.body;
    if (!name || !email || !phone || !password) {
        throw new BadRequest_1.BadRequest("جميع الحقول مطلوبة");
    }
    if (password.length < 8) {
        throw new BadRequest_1.BadRequest("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    }
    const normalizedEmail = email.trim().toLowerCase();
    // Check existing
    const [existing] = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.parents.email, normalizedEmail), (0, drizzle_orm_1.eq)(schema_1.parents.phone, phone)))
        .limit(1);
    if (existing) {
        if (existing.isVerified) {
            if (existing.email === normalizedEmail) {
                throw new BadRequest_1.BadRequest("البريد الإلكتروني مستخدم بالفعل");
            }
            if (existing.phone === phone) {
                throw new BadRequest_1.BadRequest("رقم الهاتف مستخدم بالفعل");
            }
        }
        // Update unverified account
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await db_1.db
            .update(schema_1.parents)
            .set({
            name,
            phone,
            password: hashedPassword,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.parents.id, existing.id));
        // Delete old codes & send new
        await db_1.db
            .delete(emailverfication_1.emailVerifications)
            .where((0, drizzle_orm_1.eq)(emailverfication_1.emailVerifications.parentId, existing.id));
        const code = (0, crypto_1.randomInt)(100000, 999999).toString();
        await db_1.db.insert(emailverfication_1.emailVerifications).values({
            id: (0, uuid_1.v4)(),
            parentId: existing.id,
            code,
        });
        await (0, sendEmails_1.sendEmail)(normalizedEmail, "رمز التحقق - Kidsero", `رمز التحقق الخاص بك هو: ${code}`);
        return (0, response_1.SuccessResponse)(res, {
            message: "تم تحديث بياناتك وإرسال رمز تحقق جديد",
            parentId: existing.id,
        }, 200);
    }
    // Create new account
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const parentId = (0, uuid_1.v4)();
    const code = (0, crypto_1.randomInt)(100000, 999999).toString();
    await db_1.db.insert(schema_1.parents).values({
        id: parentId,
        name,
        email: normalizedEmail,
        phone,
        nationalId: nationalId || null,
        password: hashedPassword,
        isVerified: false,
        status: "active",
    });
    await db_1.db.insert(emailverfication_1.emailVerifications).values({
        id: (0, uuid_1.v4)(),
        parentId,
        code,
    });
    await (0, sendEmails_1.sendEmail)(normalizedEmail, "رمز التحقق - Kidsero", `مرحباً ${name}!\n\nرمز التحقق الخاص بك هو: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق.`);
    return (0, response_1.SuccessResponse)(res, {
        message: "تم التسجيل بنجاح. تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        parentId,
    }, 201);
};
exports.signup = signup;
// ================== Verify Email ==================
const verifyEmail = async (req, res) => {
    const { parentId, code } = req.body;
    if (!parentId || !code) {
        throw new BadRequest_1.BadRequest("معرف المستخدم ورمز التحقق مطلوبان");
    }
    const [parent] = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.id, parentId))
        .limit(1);
    if (!parent) {
        throw new NotFound_1.NotFound("الحساب غير موجود");
    }
    if (parent.isVerified) {
        throw new BadRequest_1.BadRequest("تم التحقق من الحساب مسبقاً");
    }
    const [record] = await db_1.db
        .select()
        .from(emailverfication_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailverfication_1.emailVerifications.parentId, parentId))
        .limit(1);
    if (!record || record.code !== code) {
        throw new BadRequest_1.BadRequest("رمز التحقق غير صحيح");
    }
    // Verify
    await db_1.db
        .update(schema_1.parents)
        .set({ isVerified: true })
        .where((0, drizzle_orm_1.eq)(schema_1.parents.id, parentId));
    await db_1.db
        .delete(emailverfication_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailverfication_1.emailVerifications.parentId, parentId));
    // Generate token
    const token = (0, auth_1.generateParentToken)({
        id: parent.id,
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
    });
    return (0, response_1.SuccessResponse)(res, {
        message: "تم التحقق من البريد الإلكتروني بنجاح",
        token,
        parent: {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            phone: parent.phone,
        },
    }, 200);
};
exports.verifyEmail = verifyEmail;
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
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new BadRequest_1.BadRequest("البريد الإلكتروني مطلوب");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const [parent] = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.email, normalizedEmail))
        .limit(1);
    if (!parent) {
        return (0, response_1.SuccessResponse)(res, { message: "إذا كان البريد مسجلاً، سيتم إرسال رمز إعادة التعيين" }, 200);
    }
    if (!parent.isVerified) {
        throw new BadRequest_1.BadRequest("الحساب غير مفعل");
    }
    await db_1.db
        .delete(emailverfication_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailverfication_1.emailVerifications.parentId, parent.id));
    const code = (0, crypto_1.randomInt)(100000, 999999).toString();
    await db_1.db.insert(emailverfication_1.emailVerifications).values({
        id: (0, uuid_1.v4)(),
        parentId: parent.id,
        code,
    });
    await (0, sendEmails_1.sendEmail)(normalizedEmail, "إعادة تعيين كلمة المرور - Kidsero", `رمز إعادة تعيين كلمة المرور: ${code}\n\nصالح لمدة ساعة.`);
    return (0, response_1.SuccessResponse)(res, {
        message: "تم إرسال رمز إعادة التعيين",
        parentId: parent.id,
    }, 200);
};
exports.forgotPassword = forgotPassword;
// ================== Verify Reset Code ==================
const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        throw new BadRequest_1.BadRequest("البريد الإلكتروني ورمز التحقق مطلوبان");
    }
    const [parent] = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.email, email.trim().toLowerCase()))
        .limit(1);
    if (!parent) {
        throw new NotFound_1.NotFound("الحساب غير موجود");
    }
    const [record] = await db_1.db
        .select()
        .from(emailverfication_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailverfication_1.emailVerifications.parentId, parent.id))
        .limit(1);
    if (!record || record.code !== code) {
        throw new BadRequest_1.BadRequest("رمز التحقق غير صحيح");
    }
    return (0, response_1.SuccessResponse)(res, {
        message: "تم التحقق من الرمز",
        parentId: parent.id,
    }, 200);
};
exports.verifyResetCode = verifyResetCode;
// ================== Reset Password ==================
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
        throw new BadRequest_1.BadRequest("جميع الحقول مطلوبة");
    }
    if (newPassword.length < 8) {
        throw new BadRequest_1.BadRequest("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    }
    const [parent] = await db_1.db
        .select()
        .from(schema_1.parents)
        .where((0, drizzle_orm_1.eq)(schema_1.parents.email, email.trim().toLowerCase()))
        .limit(1);
    if (!parent) {
        throw new NotFound_1.NotFound("الحساب غير موجود");
    }
    const [record] = await db_1.db
        .select()
        .from(emailverfication_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailverfication_1.emailVerifications.parentId, parent.id))
        .limit(1);
    if (!record || record.code !== code) {
        throw new BadRequest_1.BadRequest("رمز التحقق غير صحيح");
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await db_1.db
        .update(schema_1.parents)
        .set({ password: hashedPassword })
        .where((0, drizzle_orm_1.eq)(schema_1.parents.id, parent.id));
    await db_1.db
        .delete(emailverfication_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailverfication_1.emailVerifications.parentId, parent.id));
    return (0, response_1.SuccessResponse)(res, { message: "تم تغيير كلمة المرور بنجاح" }, 200);
};
exports.resetPassword = resetPassword;
// ================== Update FCM Token ==================
const updateFcmToken = async (req, res) => {
    const parentId = req.user?.id;
    const { fcmToken } = req.body;
    if (!parentId) {
        throw new Errors_1.UnauthorizedError("غير مصرح");
    }
    if (!fcmToken) {
        throw new BadRequest_1.BadRequest("FCM Token مطلوب");
    }
    await db_1.db
        .update(schema_1.parents)
        .set({ fcmTokens: fcmToken })
        .where((0, drizzle_orm_1.eq)(schema_1.parents.id, parentId));
    return (0, response_1.SuccessResponse)(res, { message: "تم تحديث FCM Token" }, 200);
};
exports.updateFcmToken = updateFcmToken;
