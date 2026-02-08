import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';

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

  return prisma.comment.create({
    data: { postId, userId, content, parentCommentId },
    include: { user: { select: userSelect } },
  });
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

  return prisma.comment.create({
    data: { postId: parent.postId, userId, content, parentCommentId: commentId },
    include: { user: { select: userSelect } },
  });
};
