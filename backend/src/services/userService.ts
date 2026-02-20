import { prisma } from '../config/database';
import { AppError, NotFoundError } from '../utils/errors';

const userSelect = {
  id: true,
  username: true,
  nickname: true,
  bio: true,
  profileImageUrl: true,
  calendarColor: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const searchUsers = async (query: string) => {
  return prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { nickname: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: userSelect,
    take: 20,
    orderBy: { nickname: 'asc' },
  });
};

export const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw new NotFoundError('User');
  return user;
};

export const getCurrentUser = async (userId: number) => {
  return getUserById(userId);
};

export const getCalendarColors = async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true, calendarColor: { not: null } },
    select: { id: true, calendarColor: true },
  });
  return users as Array<{ id: number; calendarColor: string }>;
};

export const updateUser = async (
  userId: number,
  data: { username?: string; nickname?: string; bio?: string; profileImageUrl?: string; calendarColor?: string },
) => {
  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, id: { not: userId } },
    });
    if (existing) {
      throw new AppError('이미 사용 중인 아이디입니다.', 409);
    }
  }
  if (data.calendarColor) {
    const existing = await prisma.user.findFirst({
      where: { calendarColor: data.calendarColor, id: { not: userId } },
    });
    if (existing) {
      throw new AppError('이미 다른 가족이 사용 중인 색상입니다.', 409);
    }
  }
  return prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });
};

export const getUserPosts = async (
  userId: number,
  page: number,
  limit: number,
  requesterId: number,
) => {
  const skip = (page - 1) * limit;
  const where = { userId, deletedAt: null };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, nickname: true, profileImageUrl: true, role: true } },
        media: { orderBy: { position: 'asc' as const } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = await getLikedPostIds(
    requesterId,
    posts.map((p) => p.id),
  );
  const postsWithLikes = posts.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) }));

  return { posts: postsWithLikes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserRepliedPosts = async (
  userId: number,
  page: number,
  limit: number,
  requesterId: number,
) => {
  const commentedPostIds = await prisma.comment.findMany({
    where: { userId, deletedAt: null },
    select: { postId: true },
    distinct: ['postId'],
  });
  const postIds = commentedPostIds.map((c) => c.postId);

  const skip = (page - 1) * limit;
  const where = { id: { in: postIds }, deletedAt: null };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, nickname: true, profileImageUrl: true, role: true } },
        media: { orderBy: { position: 'asc' as const } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = await getLikedPostIds(
    requesterId,
    posts.map((p) => p.id),
  );
  const postsWithLikes = posts.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) }));

  return { posts: postsWithLikes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserMediaPosts = async (
  userId: number,
  page: number,
  limit: number,
  requesterId: number,
) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    deletedAt: null,
    media: { some: {} },
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, nickname: true, profileImageUrl: true, role: true } },
        media: { orderBy: { position: 'asc' as const } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = await getLikedPostIds(
    requesterId,
    posts.map((p) => p.id),
  );
  const postsWithLikes = posts.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) }));

  return { posts: postsWithLikes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getLikedPostIds = async (userId: number, postIds: number[]) => {
  if (postIds.length === 0) return new Set<number>();
  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: postIds }, commentId: null },
    select: { postId: true },
  });
  return new Set(likes.map((l) => l.postId));
};
