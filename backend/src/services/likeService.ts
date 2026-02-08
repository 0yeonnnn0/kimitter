import { prisma } from '../config/database';

const userSelect = { id: true, username: true, nickname: true, profileImageUrl: true };

export const togglePostLike = async (userId: number, postId: number) => {
  const existing = await prisma.like.findFirst({ where: { userId, postId, commentId: null } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.like.create({ data: { userId, postId } });
  return { liked: true };
};

export const toggleCommentLike = async (userId: number, commentId: number) => {
  const existing = await prisma.like.findFirst({ where: { userId, commentId, postId: null } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.like.create({ data: { userId, commentId } });
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
