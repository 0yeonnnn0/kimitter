import { create } from 'zustand';
import * as notificationService from '../services/notificationService';
import type { Notification } from '../types/models';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const [allRes, unreadRes] = await Promise.all([
      notificationService.getNotifications(1, 50),
      notificationService.getUnreadNotifications(),
    ]);
    set({
      notifications: allRes.data.data,
      unreadCount: unreadRes.data.data.count,
    });
  },

  markRead: async (id) => {
    await notificationService.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationService.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
