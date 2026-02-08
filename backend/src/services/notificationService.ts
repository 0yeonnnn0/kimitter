import { Expo } from 'expo-server-sdk';
import { DeviceType, NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const expo = new Expo();

const sendPushNotification = async (
  recipientId: number,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) => {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: recipientId, isActive: true },
  });

  if (!tokens.length) return;

  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({ to: t.token, title, body, data }));

  if (!messages.length) return;

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    logger.error('Push notification failed', { error: err });
  }
};

export const notifyPostMention = async (
  senderId: number,
  recipientIds: number[],
  postId: number,
  message?: string,
) => {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { nickname: true },
  });

  await Promise.all(
    recipientIds.map(async (recipientId) => {
      await prisma.notification.create({
        data: {
          postId,
          senderId,
          recipientId,
          notificationType: NotificationType.POST_MENTION,
          message,
        },
      });
      await sendPushNotification(
        recipientId,
        sender?.nickname ?? '누군가',
        message ?? '새 글을 확인해보세요!',
        { postId },
      );
    }),
  );
};

export const getNotifications = async (userId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { recipientId: userId };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, nickname: true, profileImageUrl: true } },
        post: { select: { id: true, content: true } },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUnreadNotifications = async (userId: number) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId, isRead: false },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, nickname: true, profileImageUrl: true } },
      post: { select: { id: true, content: true } },
    },
  });

  return { notifications, count: notifications.length };
};

export const markAsRead = async (notificationId: number, userId: number) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError('Notification');
  if (notification.recipientId !== userId) throw new ForbiddenError();

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
};

export const markAllAsRead = async (userId: number) => {
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
};

export const deleteNotification = async (notificationId: number, userId: number) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError('Notification');
  if (notification.recipientId !== userId) throw new ForbiddenError();
  await prisma.notification.delete({ where: { id: notificationId } });
};

export const registerPushToken = async (
  userId: number,
  token: string,
  deviceType: DeviceType,
) => {
  return prisma.pushToken.upsert({
    where: { userId_token: { userId, token } },
    create: { userId, token, deviceType },
    update: { isActive: true, deviceType },
  });
};

export const deactivatePushToken = async (userId: number, token: string) => {
  await prisma.pushToken.updateMany({
    where: { userId, token },
    data: { isActive: false },
  });
};
