import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

const userSelect = {
  id: true,
  username: true,
  nickname: true,
  profileImageUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw new NotFoundError('User');
  return user;
};

export const getCurrentUser = async (userId: number) => {
  return getUserById(userId);
};

export const updateUser = async (
  userId: number,
  data: { nickname?: string; profileImageUrl?: string },
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });
};

export const getUserPosts = async (userId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { userId, deletedAt: null };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserComments = async (userId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { userId, deletedAt: null };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: { select: { id: true, content: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserMedia = async (userId: number, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    prisma.postMedia.findMany({
      where: { post: { userId, deletedAt: null } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { id: true } } },
    }),
    prisma.postMedia.count({ where: { post: { userId, deletedAt: null } } }),
  ]);

  return { media, total, page, limit, totalPages: Math.ceil(total / limit) };
};
