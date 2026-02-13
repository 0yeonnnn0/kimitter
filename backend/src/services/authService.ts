import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { config } from '../config/environment';

const SALT_ROUNDS = 10;

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

export const validateInvitationCode = async (code: string) => {
  const invitation = await prisma.invitationCode.findUnique({ where: { code } });
  if (!invitation) {
    throw new ValidationError('Invalid invitation code');
  }
  if (invitation.usedBy) {
    throw new ValidationError('Invitation code already used');
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw new ValidationError('Invitation code expired');
  }
  return { valid: true };
};

export const register = async (
  code: string,
  username: string,
  password: string,
  nickname: string,
) => {
  await validateInvitationCode(code);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new ConflictError('Username already taken');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { username, passwordHash, nickname },
      select: userSelect,
    });

    await tx.invitationCode.update({
      where: { code },
      data: { usedBy: newUser.id, usedAt: new Date() },
    });

    return newUser;
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user, accessToken, refreshToken };
};

export const login = async (username: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.role === 'BOT') {
    throw new ForbiddenError('Bot accounts cannot login');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

export const refresh = async (token: string) => {
  const payload = verifyRefreshToken(token);

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: userSelect,
  });
  if (!user) throw new NotFoundError('User');

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const accessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
};
