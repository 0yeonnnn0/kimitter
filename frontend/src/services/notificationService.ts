import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Notification } from '../types/models';

export const getNotifications = (page = 1, limit = 20) =>
  api.get<PaginatedResponse<Notification>>('/notifications', { params: { page, limit } });

export const getUnreadNotifications = () =>
  api.get<ApiResponse<{ notifications: Notification[]; count: number }>>('/notifications/unread');

export const markAsRead = (notificationId: number) =>
  api.put(`/notifications/${notificationId}`);

export const markAllAsRead = () =>
  api.put('/notifications/read-all');

export const registerPushToken = (token: string, deviceType: 'IOS' | 'ANDROID') =>
  api.post('/notifications/register-token', { token, deviceType });

export const sendPostNotification = (
  postId: number,
  recipientIds: number[],
  message?: string,
) => api.post(`/notifications/posts/${postId}/notify`, { recipientIds, message });

export const broadcastNotification = (message: string) =>
  api.post<ApiResponse<{ recipientCount: number }>>('/notifications/broadcast', { message });
