import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendPushNotification } from './notificationService';
import { sendBotWebhook } from './webhookService';

const userSelect = { id: true, username: true, nickname: true, profileImageUrl: true };

export const createComment = async (
  postId: number,
  userId: number,
  content: string,
  parentCommentId?: number,
) => {
  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new NotFoundError('Post');

  if (parentCommentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentCommentId, deletedAt: null },
    });
    if (!parent) throw new NotFoundError('Parent comment');
  }

  const comment = await prisma.comment.create({
    data: { postId, userId, content, parentCommentId },
    include: { user: { select: userSelect } },
  });

  try {
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });
    const senderName = sender?.nickname ?? '누군가';

    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { userId: true },
      });
      if (parent && parent.userId !== userId) {
        await prisma.notification.create({
          data: {
            postId,
            senderId: userId,
            recipientId: parent.userId,
            notificationType: NotificationType.REPLY,
            message: content,
          },
        });
        await sendPushNotification(
          parent.userId,
          `${senderName}님이 답글을 남겼습니다`,
          content,
          { postId },
        );
      }
    } else if (post.userId !== userId) {
      await prisma.notification.create({
        data: {
          postId,
          senderId: userId,
          recipientId: post.userId,
          notificationType: NotificationType.COMMENT,
          message: content,
        },
      });
      await sendPushNotification(
        post.userId,
        `${senderName}님이 댓글을 남겼습니다`,
        content,
        { postId },
      );
    }
  } catch (err) {
    logger.error('Failed to create comment notification', { error: err });
  }

  const postAuthor = await prisma.user.findUnique({
    where: { id: post.userId },
    select: { id: true, role: true },
  });
  const commentAuthor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true },
  });

  if (postAuthor?.role === 'BOT' && commentAuthor?.role !== 'BOT') {
    sendBotWebhook({
      postId,
      commentId: comment.id,
      commentContent: content,
      commentAuthor: {
        id: commentAuthor!.id,
        username: commentAuthor!.username,
        role: commentAuthor!.role,
      },
      parentCommentId: parentCommentId ?? null,
    }).catch((err) => logger.error('Webhook dispatch failed', { error: err }));
  }

  return comment;
};

export const getCommentsByPost = async (postId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { postId, parentCommentId: null, deletedAt: null };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: userSelect },
        replies: {
          where: { deletedAt: null },
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { likes: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const updateComment = async (commentId: number, userId: number, content: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
  });
  if (!comment) throw new NotFoundError('Comment');
  if (comment.userId !== userId) throw new ForbiddenError('Not the comment owner');

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { user: { select: userSelect } },
  });
};

export const deleteComment = async (commentId: number, userId: number, userRole: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
  });
  if (!comment) throw new NotFoundError('Comment');
  if (comment.userId !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenError('Cannot delete this comment');
  }
  await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
};

export const createReply = async (commentId: number, userId: number, content: string) => {
  const parent = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
  });
  if (!parent) throw new NotFoundError('Comment');

  const reply = await prisma.comment.create({
    data: { postId: parent.postId, userId, content, parentCommentId: commentId },
    include: { user: { select: userSelect } },
  });

  try {
    if (parent.userId !== userId) {
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true },
      });
      await prisma.notification.create({
        data: {
          postId: parent.postId,
          senderId: userId,
          recipientId: parent.userId,
          notificationType: NotificationType.REPLY,
          message: content,
        },
      });
      await sendPushNotification(
        parent.userId,
        `${sender?.nickname ?? '누군가'}님이 답글을 남겼습니다`,
        content,
        { postId: parent.postId },
      );
    }
  } catch (err) {
    logger.error('Failed to create reply notification', { error: err });
  }

  const post = await prisma.post.findUnique({
    where: { id: parent.postId },
    select: { userId: true },
  });
  if (post) {
    const postAuthor = await prisma.user.findUnique({
      where: { id: post.userId },
      select: { id: true, role: true },
    });
    const replyAuthor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true },
    });

    if (postAuthor?.role === 'BOT' && replyAuthor?.role !== 'BOT') {
      sendBotWebhook({
        postId: parent.postId,
        commentId: reply.id,
        commentContent: content,
        commentAuthor: {
          id: replyAuthor!.id,
          username: replyAuthor!.username,
          role: replyAuthor!.role,
        },
        parentCommentId: commentId,
      }).catch((err) => logger.error('Webhook dispatch failed', { error: err }));
    }
  }

  return reply;
};
