import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getCurrentUser(req.userId!);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(Number(req.params.userId));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: { nickname?: string; profileImageUrl?: string } = {};
    if (req.body.nickname) data.nickname = req.body.nickname;
    if (req.file) data.profileImageUrl = `/uploads/${req.file.filename}`;
    const user = await userService.updateUser(req.userId!, data);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await userService.getUserPosts(Number(req.params.userId), page, limit);
    res.json({ success: true, data: result.posts, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) {
    next(err);
  }
};

export const getUserComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await userService.getUserComments(Number(req.params.userId), page, limit);
    res.json({ success: true, data: result.comments, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) {
    next(err);
  }
};

export const getUserMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await userService.getUserMedia(Number(req.params.userId), page, limit);
    res.json({ success: true, data: result.media, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) {
    next(err);
  }
};
