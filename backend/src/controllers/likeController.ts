import { Request, Response, NextFunction } from 'express';
import * as likeService from '../services/likeService';

export const togglePostLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await likeService.togglePostLike(req.userId!, Number(req.params.postId));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const toggleCommentLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await likeService.toggleCommentLike(req.userId!, Number(req.params.commentId));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getPostLikes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await likeService.getPostLikes(Number(req.params.postId), page, limit);
    res.json({
      success: true,
      data: result.likes,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

export const getCommentLikes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await likeService.getCommentLikes(Number(req.params.commentId), page, limit);
    res.json({
      success: true,
      data: result.likes,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};
