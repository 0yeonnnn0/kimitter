import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export const createInvitationCode = async (adminId: number, expiresAt?: Date) => {
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  return prisma.invitationCode.create({
    data: { code, createdBy: adminId, expiresAt },
  });
};

export const getInvitationCodes = async () => {
  return prisma.invitationCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, username: true, nickname: true } },
      user: { select: { id: true, username: true, nickname: true } },
    },
  });
};

export const deleteInvitationCode = async (code: string) => {
  const invitation = await prisma.invitationCode.findUnique({ where: { code } });
  if (!invitation) throw new NotFoundError('Invitation code');
  await prisma.invitationCode.delete({ where: { code } });
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      nickname: true,
      profileImageUrl: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const updateUserRole = async (userId: number, role: Role) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, username: true, nickname: true, role: true },
  });
};

export const deleteUser = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
};

export const deletePostAdmin = async (postId: number) => {
  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new NotFoundError('Post');
  await prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
};

export const getStatistics = async () => {
  const [totalUsers, totalPosts, totalComments, totalLikes] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.comment.count({ where: { deletedAt: null } }),
    prisma.like.count(),
  ]);

  return { totalUsers, totalPosts, totalComments, totalLikes };
};
