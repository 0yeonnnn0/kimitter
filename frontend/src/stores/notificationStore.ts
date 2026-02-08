import { create } from 'zustand';
import * as notificationService from '../services/notificationService';
import type { Notification } from '../types/models';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchUnread: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchUnread: async () => {
    const { data } = await notificationService.getUnreadNotifications();
    set({ notifications: data.data.notifications, unreadCount: data.data.count });
  },

  markRead: async (id) => {
    await notificationService.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationService.markAllAsRead();
    set({ notifications: [], unreadCount: 0 });
  },
}));
