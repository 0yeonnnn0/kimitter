import { MediaType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';

const postInclude = {
  user: { select: { id: true, username: true, nickname: true, profileImageUrl: true } },
  media: { orderBy: { position: 'asc' as const } },
  tags: { include: { tag: true } },
  _count: { select: { likes: true, comments: true } },
};

const addIsLiked = async <T extends { id: number }>(
  posts: T[],
  userId: number,
): Promise<(T & { isLiked: boolean })[]> => {
  const postIds = posts.map((p) => p.id);
  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: postIds }, commentId: null },
    select: { postId: true },
  });
  const likedPostIds = new Set(likes.map((l) => l.postId));
  return posts.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) }));
};

const getMediaType = (mimetype: string): MediaType => {
  if (mimetype === 'image/gif') return 'GIF';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  return 'PHOTO';
};

const parseTagNames = (tags?: string): string[] => {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const upsertTags = async (tagNames: string[]) => {
  return Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
    ),
  );
};

export const createPost = async (
  userId: number,
  content: string,
  tagsRaw?: string,
  files?: Express.Multer.File[],
) => {
  const tagNames = parseTagNames(tagsRaw);
  const tags = await upsertTags(tagNames);

  const post = await prisma.post.create({
    data: {
      userId,
      content,
      media: files?.length
        ? {
            create: files.map((f, i) => ({
              mediaType: getMediaType(f.mimetype),
              fileUrl: `/uploads/${f.filename}`,
              fileName: f.originalname,
              fileSize: f.size,
              position: i,
            })),
          }
        : undefined,
      tags: tags.length
        ? { create: tags.map((t) => ({ tagId: t.id })) }
        : undefined,
    },
    include: postInclude,
  });

  return post;
};

export const getPosts = async (page: number, limit: number, userId: number) => {
  const skip = (page - 1) * limit;
  const where = { deletedAt: null };

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

  const postsWithLikes = await addIsLiked(posts, userId);
  return { posts: postsWithLikes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getPostById = async (postId: number, userId: number) => {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: postInclude,
  });
  if (!post) throw new NotFoundError('Post');
  const [postWithLike] = await addIsLiked([post], userId);
  return postWithLike;
};

export const updatePost = async (
  postId: number,
  userId: number,
  content?: string,
  tagsRaw?: string,
) => {
  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new NotFoundError('Post');
  if (post.userId !== userId) throw new ForbiddenError('Not the post owner');

  const updateData: { content?: string } = {};
  if (content) updateData.content = content;

  if (tagsRaw !== undefined) {
    const tagNames = parseTagNames(tagsRaw);
    const tags = await upsertTags(tagNames);
    await prisma.postTag.deleteMany({ where: { postId } });
    if (tags.length) {
      await prisma.postTag.createMany({
        data: tags.map((t) => ({ postId, tagId: t.id })),
      });
    }
  }

  return prisma.post.update({
    where: { id: postId },
    data: updateData,
    include: postInclude,
  });
};

export const deletePost = async (postId: number, userId: number, userRole: string) => {
  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new NotFoundError('Post');
  if (post.userId !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenError('Cannot delete this post');
  }
  await prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
};

export const searchPosts = async (
  page: number,
  limit: number,
  userId: number,
  q?: string,
  month?: string,
  mediaType?: string,
  mediaOnly?: boolean,
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = { deletedAt: null };

  if (q) {
    where.content = { contains: q, mode: 'insensitive' };
  }

  if (month) {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    where.createdAt = { gte: start, lt: end };
  }

  if (mediaType) {
    where.media = { some: { mediaType: mediaType as MediaType } };
  } else if (mediaOnly) {
    where.media = { some: {} };
  }

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

  const postsWithLikes = await addIsLiked(posts, userId);
  return { posts: postsWithLikes, total, page, limit, totalPages: Math.ceil(total / limit) };
};
