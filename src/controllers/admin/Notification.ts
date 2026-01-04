import { Request, Response } from "express";
import { messaging } from "../../utils/firebase";
import { notifications, userNotifications } from "../../models/schema";
import { users } from "../../models/schema";
import { db } from "../../models/db";
import { isNotNull } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { v4 as uuidv4 } from "uuid";
import { eq ,desc} from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";


export const sendNotificationToAll = async (req: Request, res: Response) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      throw new BadRequest("Title and body are required");
    }

    console.log("🚀 Starting notification process...");

    // 1. حفظ الإشعار في جدول notifications
    const newNotificationId = uuidv4();
    await db.insert(notifications).values({
      id: newNotificationId,
      title,
      body,
    });

    console.log(`✅ Notification saved with ID: ${newNotificationId}`);

    // 2. جلب كل المستخدمين مع التوكنات في استعلام واحد
    const allUsersWithTokens = await db
      .select({ 
        id: users.id,
        fcmtoken: users.fcmtoken 
      })
      .from(users);

    if (!allUsersWithTokens.length) {
      throw new NotFound("No users found");
    }

    console.log(`📊 Total users found: ${allUsersWithTokens.length}`);

    // 3. ربط الإشعار بكل المستخدمين
    const userNotificationsData = allUsersWithTokens.map(user => ({
      id: uuidv4(),
      userId: user.id,
      notificationId: newNotificationId,
      status: "unseen" as const,
    }));

    await db.insert(userNotifications).values(userNotificationsData);
    
    console.log(`✅ Created ${userNotificationsData.length} user-notification relationships`);

    // 4. جلب التوكنات الصحيحة فقط
    const tokens = allUsersWithTokens
      .map(user => user.fcmtoken)
      .filter(token => {
        // تحقق من إن التوكن موجود ومش فاضي ومش null
        return token && 
               typeof token === 'string' && 
               token.trim().length > 0 &&
               token !== 'null' &&
               token !== 'undefined';
      }) as string[];

    console.log(`📊 Users with valid FCM tokens: ${tokens.length}`);
    console.log(`🔍 Sample tokens:`, tokens.slice(0, 2).map(t => `${t.substring(0, 20)}...`));

    if (!tokens.length) {
      res.json({
        success: true,
        message: "Notification saved but no valid FCM tokens found",
        notificationId: newNotificationId,
        stats: {
          totalUsers: allUsersWithTokens.length,
          validTokens: 0,
          usersWithTokens: allUsersWithTokens.filter(u => u.fcmtoken).length,
        },
      });
      return;
    }

    // 5. إرسال الإشعار لكل التوكنات
    const message = {
      notification: { 
        title, 
        body 
      },
      tokens,
    };

    console.log("🚀 Sending FCM notification...");
    console.log(`📤 Message payload:`, { title, body, tokenCount: tokens.length });

    const response = await messaging.sendEachForMulticast(message);

    console.log("✅ FCM Response received:");
    console.log(`✅ Success: ${response.successCount}`);
    console.log(`❌ Failures: ${response.failureCount}`);

    // 6. تسجيل تفاصيل الأخطاء إن وجدت
    if (response.failureCount > 0) {
      console.log("❌ Failed deliveries details:");
      response.responses.forEach((resp, index) => {
        if (!resp.success && resp.error) {
          console.log(`  Token ${index}: ${resp.error.code} - ${resp.error.message}`);
        }
      });
    }

    res.json({
      success: true,
      message: "Notification sent successfully",
      notificationId: newNotificationId,
      results: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length,
      },
      stats: {
        totalUsers: allUsersWithTokens.length,
        validTokens: tokens.length,
        usersWithTokens: allUsersWithTokens.filter(u => u.fcmtoken).length,
      },
    });

  } catch (error) {
    console.error("❌ Error in sendNotificationToAll:", error);
    
    // طباعة تفاصيل الخطأ
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    throw error;
  }
};

// دالة تست للتحقق من النظام
export const testFCMSetup = async (req: Request, res: Response) => {
  try {
    console.log("🔍 Testing FCM setup...");

    // 1. تحقق من المستخدمين
    const allUsers = await db.select({ 
      id: users.id, 
      fcmtoken: users.fcmtoken 
    }).from(users);

    // 2. إحصائيات التوكنات
    const usersWithTokens = allUsers.filter(u => u.fcmtoken);
    const validTokens = allUsers.filter(u => 
      u.fcmtoken && 
      typeof u.fcmtoken === 'string' && 
      u.fcmtoken.trim().length > 0 &&
      u.fcmtoken !== 'null' &&
      u.fcmtoken !== 'undefined'
    );

    console.log("📊 FCM Setup Statistics:");
    console.log(`  Total users: ${allUsers.length}`);
    console.log(`  Users with tokens: ${usersWithTokens.length}`);
    console.log(`  Valid tokens: ${validTokens.length}`);

    // 3. عينة من التوكنات
    const sampleTokens = validTokens.slice(0, 3).map(user => ({
      userId: user.id,
      tokenPreview: user.fcmtoken?.substring(0, 30) + "...",
      tokenLength: user.fcmtoken?.length
    }));

    console.log("🔍 Sample tokens:", sampleTokens);

    res.json({
      success: true,
      message: "FCM setup test completed",
      stats: {
        totalUsers: allUsers.length,
        usersWithTokens: usersWithTokens.length,
        validTokens: validTokens.length,
        sampleTokens
      }
    });

  } catch (error) {
    console.error("❌ Test error:", error);
    throw error;
  }
};


// ✅ Get All
export const getAllNotifications = async (req: Request, res: Response) => {
  const data = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt));

  res.json({ success: true, data });
};

// ✅ Get by ID
export const getNotificationById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const data = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!data.length) {
    throw new NotFound("Notification not found");
  }

  res.json({ success: true, data: data[0] });
};

// ✅ Update
export const updateNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, body } = req.body;

  if (!title || !body) {
    throw new BadRequest("Title and body are required");
  }

  const existing = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!existing.length) {
    throw new NotFound("Notification not found");
  }

  await db
    .update(notifications)
    .set({ title, body })
    .where(eq(notifications.id, id));

  res.json({
    success: true,
    message: "Notification updated successfully",
    data: { ...existing[0], title, body },
  });
};

// ✅ Delete
export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!existing.length) {
    throw new NotFound("Notification not found");
  }

  await db.delete(notifications).where(eq(notifications.id, id));

  res.json({
    success: true,
    message: "Notification deleted successfully",
  });
};