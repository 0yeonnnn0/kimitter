import { prisma } from '../config/database';

const userSelect = { id: true, username: true, nickname: true, profileImageUrl: true };
const postSelect = { id: true, content: true };

export const getLikesActivity = async (userId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = {
    OR: [
      { post: { userId } },
      { comment: { userId } },
    ],
    userId: { not: userId },
  };

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: userSelect },
        post: { select: postSelect },
        comment: { select: { id: true, content: true } },
      },
    }),
    prisma.like.count({ where }),
  ]);

  return { likes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getCommentsActivity = async (userId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { post: { userId }, userId: { not: userId }, deletedAt: null };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: userSelect },
        post: { select: postSelect },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getNotificationsActivity = async (userId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { recipientId: userId };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: userSelect },
        post: { select: postSelect },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getAllActivity = async (userId: number, page: number, limit: number) => {
  const [likesResult, commentsResult, notificationsResult] = await Promise.all([
    getLikesActivity(userId, 1, 50),
    getCommentsActivity(userId, 1, 50),
    getNotificationsActivity(userId, 1, 50),
  ]);

  const merged = [
    ...likesResult.likes.map((l) => ({ type: 'like' as const, createdAt: l.createdAt, data: l })),
    ...commentsResult.comments.map((c) => ({ type: 'comment' as const, createdAt: c.createdAt, data: c })),
    ...notificationsResult.notifications.map((n) => ({ type: 'notification' as const, createdAt: n.createdAt, data: n })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice((page - 1) * limit, page * limit);

  const total = likesResult.total + commentsResult.total + notificationsResult.total;

  return { activity: merged, total, page, limit, totalPages: Math.ceil(total / limit) };
};
