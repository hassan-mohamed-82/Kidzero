import { Request, Response } from "express";
import { notifications,userNotifications  } from "../../models/schema";
import { db } from "../../models/db";
import { UnauthorizedError } from "../../Errors";
import { NotFound } from "../../Errors/NotFound";
import { eq,and,desc } from "drizzle-orm";

// 📌 1. جلب كل الإشعارات الخاصة باليوزر
export const getAllNotifications = async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError("User not authenticated");

  const userId = req.user.id;

  const allNotifications = await db
    .select({
      id: userNotifications.id,
      status: userNotifications.status,
      createdAt: userNotifications.createdAt,
      title: notifications.title,
      body: notifications.body,
    })
    .from(userNotifications)
    .innerJoin(notifications, eq(userNotifications.notificationId, notifications.id))
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt));

  // ✅ بعد ما يجيبهم، يغيّر الحالات لـ seen
  await db
    .update(userNotifications)
    .set({ status: "seen" })
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.status, "unseen")));

  res.json({ notifications: allNotifications });
};

// 📌 2. جلب عدد الإشعارات الغير مقروءة
export const getUnseenCount = async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError("User not authenticated");

  const userId = req.user.id;

  const unseen = await db
    .select()
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.status, "unseen")));

  res.json({ unseenCount: unseen.length });
};

// 📌 3. جلب إشعار واحد + تحديث حالته لو كان unseen
export const getNotificationById = async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError("User not authenticated");

  const userId = req.user.id;
  const { id } = req.params;

  const notif = await db
    .select({
      id: userNotifications.id,
      status: userNotifications.status,
      createdAt: userNotifications.createdAt,
      title: notifications.title,
      body: notifications.body,
    })
    .from(userNotifications)
    .innerJoin(notifications, eq(userNotifications.notificationId, notifications.id))
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));

  if (!notif.length) throw new NotFound("Notification not found");

  if (notif[0].status === "unseen") {
    await db
      .update(userNotifications)
      .set({ status: "seen" })
      .where(eq(userNotifications.id, id));
  }

  res.json(notif[0]);
};
