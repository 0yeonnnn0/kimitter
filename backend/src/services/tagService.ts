import { prisma } from '../config/database';

const postInclude = {
  user: { select: { id: true, username: true, nickname: true, profileImageUrl: true } },
  media: true,
  tags: { include: { tag: true } },
  _count: { select: { likes: true, comments: true } },
};

export const getAllTags = async () => {
  return prisma.tag.findMany({ orderBy: { name: 'asc' } });
};

export const getPopularTags = async (limit: number) => {
  return prisma.tag.findMany({
    take: limit,
    orderBy: { posts: { _count: 'desc' } },
    include: { _count: { select: { posts: true } } },
  });
};

export const searchTags = async (query: string) => {
  return prisma.tag.findMany({
    where: { name: { startsWith: query, mode: 'insensitive' } },
    orderBy: { name: 'asc' },
    take: 20,
  });
};

export const getPostsByTag = async (tagName: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const where = { tags: { some: { tag: { name: tagName } } }, deletedAt: null };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: postInclude,
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
};
