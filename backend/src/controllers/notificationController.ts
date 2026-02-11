import { Request, Response, NextFunction } from 'express';
import { DeviceType } from '@prisma/client';
import * as notificationService from '../services/notificationService';

export const sendPostNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.notifyPostMention(
      req.userId!,
      req.body.recipientIds,
      Number(req.params.postId),
      req.body.message,
    );
    res.json({ success: true, data: { message: 'Notifications sent' } });
  } catch (err) {
    next(err);
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await notificationService.getNotifications(req.userId!, page, limit);
    res.json({
      success: true,
      data: result.notifications,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

export const getUnreadNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.getUnreadNotifications(req.userId!);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.markAsRead(
      Number(req.params.notificationId),
      req.userId!,
    );
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.deleteNotification(Number(req.params.notificationId), req.userId!);
    res.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (err) {
    next(err);
  }
};

export const broadcastNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.broadcastNotification(
      req.userId!,
      req.body.message,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const registerToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pushToken = await notificationService.registerPushToken(
      req.userId!,
      req.body.token,
      req.body.deviceType as DeviceType,
    );
    res.json({ success: true, data: pushToken });
  } catch (err) {
    next(err);
  }
};
