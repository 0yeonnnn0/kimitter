import { prisma } from '../config/database';
import * as authService from './authService';
import bcrypt from 'bcryptjs';

jest.mock('../config/environment', () => ({
  config: {
    jwtSecret: 'test-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtExpiration: '1h',
    jwtRefreshExpiration: '7d',
    nodeEnv: 'test',
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('../config/database', () => ({
  prisma: {
    invitationCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn({
      user: {
        create: jest.fn().mockResolvedValue({
          id: 1,
          username: 'testuser',
          nickname: '테스터',
          profileImageUrl: null,
          role: 'USER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      invitationCode: { update: jest.fn() },
    })),
  },
}));

const db = prisma as unknown as {
  invitationCode: { findUnique: jest.Mock; update: jest.Mock };
  user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  refreshToken: { create: jest.Mock; findUnique: jest.Mock; delete: jest.Mock; deleteMany: jest.Mock };
  $transaction: jest.Mock;
};

const baseUser = {
  id: 1,
  username: 'testuser',
  nickname: '테스터',
  profileImageUrl: null,
  role: 'USER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('validateInvitationCode', () => {
  it('throws ValidationError for non-existent code', async () => {
    db.invitationCode.findUnique.mockResolvedValue(null);
    await expect(authService.validateInvitationCode('INVALID')).rejects.toMatchObject({
      message: 'Invalid invitation code',
      statusCode: 400,
    });
  });

  it('throws ValidationError for already-used code', async () => {
    db.invitationCode.findUnique.mockResolvedValue({ code: 'USED', usedBy: 99, expiresAt: null });
    await expect(authService.validateInvitationCode('USED')).rejects.toMatchObject({
      message: 'Invitation code already used',
    });
  });

  it('throws ValidationError for expired code', async () => {
    db.invitationCode.findUnique.mockResolvedValue({
      code: 'EXP',
      usedBy: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(authService.validateInvitationCode('EXP')).rejects.toMatchObject({
      message: 'Invitation code expired',
    });
  });

  it('returns { valid: true } for valid code', async () => {
    db.invitationCode.findUnique.mockResolvedValue({
      code: 'VALID1',
      usedBy: null,
      expiresAt: null,
    });
    await expect(authService.validateInvitationCode('VALID1')).resolves.toEqual({ valid: true });
  });
});

describe('login', () => {
  it('throws UnauthorizedError when user not found', async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(authService.login('noone', 'pass')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws UnauthorizedError when user is inactive', async () => {
    db.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false, passwordHash: 'x' });
    await expect(authService.login('testuser', 'pass')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws UnauthorizedError when password is wrong', async () => {
    db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(authService.login('testuser', 'wrongpass')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('allows BOT users to login successfully', async () => {
    db.user.findUnique.mockResolvedValue({ ...baseUser, role: 'BOT', passwordHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    db.refreshToken.create.mockResolvedValue({});

    const result = await authService.login('botuser', 'pass');
    expect(result.user.username).toBe('testuser');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('returns user, accessToken, refreshToken on success', async () => {
    db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    db.refreshToken.create.mockResolvedValue({});

    const result = await authService.login('testuser', 'correctpass');
    expect(result.user.username).toBe('testuser');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});

describe('logout', () => {
  it('calls deleteMany on refreshToken', async () => {
    db.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    await authService.logout('some-token');
    expect(db.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'some-token' } });
  });
});
