import { prisma } from '../config/database';
import * as notificationService from './notificationService';

jest.mock('../config/database', () => ({ prisma: require('../test/helpers').makePrismaMock() }));
jest.mock('../config/environment', () => ({ config: { nodeEnv: 'test' } }));
jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    chunkPushNotifications: jest.fn().mockReturnValue([]),
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
  })),
}));
jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const db = prisma as unknown as ReturnType<typeof import('../test/helpers').makePrismaMock>;

describe('getUnreadNotifications', () => {
  it('returns notifications and count', async () => {
    const mockNotifs = [{ id: 1, isRead: false }, { id: 2, isRead: false }];
    db.notification.findMany.mockResolvedValue(mockNotifs);

    const result = await notificationService.getUnreadNotifications(1);
    expect(result.notifications).toHaveLength(2);
    expect(result.count).toBe(2);
  });
});

describe('markAsRead', () => {
  it('throws NotFoundError when notification does not exist', async () => {
    db.notification.findUnique.mockResolvedValue(null);
    await expect(notificationService.markAsRead(99, 1)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws ForbiddenError when not the recipient', async () => {
    db.notification.findUnique.mockResolvedValue({ id: 1, recipientId: 99 });
    await expect(notificationService.markAsRead(1, 1)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('marks notification as read', async () => {
    db.notification.findUnique.mockResolvedValue({ id: 1, recipientId: 1 });
    db.notification.update.mockResolvedValue({ id: 1, isRead: true });
    const result = await notificationService.markAsRead(1, 1);
    expect(result.isRead).toBe(true);
  });
});

describe('markAllAsRead', () => {
  it('calls updateMany with correct where clause', async () => {
    db.notification.updateMany.mockResolvedValue({ count: 3 });
    await notificationService.markAllAsRead(1);
    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: 1, isRead: false },
        data: expect.objectContaining({ isRead: true }),
      }),
    );
  });
});

describe('notifyPostMention', () => {
  it('skips notification for BOT recipients', async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ nickname: 'Sender' })
      .mockResolvedValueOnce({ role: 'BOT' });

    await notificationService.notifyPostMention(1, [2], 10, 'Test message');

    expect(db.notification.create).not.toHaveBeenCalled();
  });
});

describe('broadcastNotification', () => {
  it('excludes BOT users from broadcast', async () => {
    db.user.findMany.mockResolvedValue([{ id: 2 }, { id: 3 }]);
    db.user.findUnique.mockResolvedValue({ nickname: 'Sender' });
    db.notification.create.mockResolvedValue({ id: 1 });
    db.pushToken.findMany.mockResolvedValue([]);

    await notificationService.broadcastNotification(1, 'Broadcast message');

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: { not: 'BOT' } }),
      }),
    );
  });
});
