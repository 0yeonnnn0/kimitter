import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const userSelect = { id: true, username: true, nickname: true, profileImageUrl: true };

export const togglePostLike = async (userId: number, postId: number) => {
  const existing = await prisma.like.findFirst({ where: { userId, postId, commentId: null } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.like.create({ data: { userId, postId } });

  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== userId) {
      const sender = await prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
      await prisma.notification.create({
        data: {
          postId,
          senderId: userId,
          recipientId: post.userId,
          notificationType: NotificationType.LIKE,
          message: `${sender?.nickname ?? '누군가'}님이 회원님의 게시물을 좋아합니다.`,
        },
      });
    }
  } catch (err) {
    logger.error('Failed to create like notification', { error: err });
  }

  return { liked: true };
};

export const toggleCommentLike = async (userId: number, commentId: number) => {
  const existing = await prisma.like.findFirst({ where: { userId, commentId, postId: null } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.like.create({ data: { userId, commentId } });

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true },
    });
    if (comment && comment.userId !== userId) {
      const sender = await prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
      await prisma.notification.create({
        data: {
          postId: comment.postId,
          senderId: userId,
          recipientId: comment.userId,
          notificationType: NotificationType.LIKE,
          message: `${sender?.nickname ?? '누군가'}님이 회원님의 댓글을 좋아합니다.`,
        },
      });
    }
  } catch (err) {
    logger.error('Failed to create comment like notification', { error: err });
  }

  return { liked: true };
};

export const getPostLikes = async (postId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { postId, commentId: null };

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: userSelect } },
    }),
    prisma.like.count({ where }),
  ]);

  return { likes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getCommentLikes = async (commentId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { commentId, postId: null };

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: userSelect } },
    }),
    prisma.like.count({ where }),
  ]);

  return { likes, total, page, limit, totalPages: Math.ceil(total / limit) };
};
