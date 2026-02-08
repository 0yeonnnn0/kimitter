import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await commentService.createComment(
      Number(req.params.postId),
      req.userId!,
      req.body.content,
      req.body.parentCommentId ? Number(req.body.parentCommentId) : undefined,
    );
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const getCommentsByPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const result = await commentService.getCommentsByPost(Number(req.params.postId), page, limit);
    res.json({
      success: true,
      data: result.comments,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await commentService.updateComment(
      Number(req.params.commentId),
      req.userId!,
      req.body.content,
    );
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await commentService.deleteComment(Number(req.params.commentId), req.userId!, req.userRole!);
    res.json({ success: true, data: { message: 'Comment deleted' } });
  } catch (err) {
    next(err);
  }
};

export const createReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reply = await commentService.createReply(
      Number(req.params.commentId),
      req.userId!,
      req.body.content,
    );
    res.status(201).json({ success: true, data: reply });
  } catch (err) {
    next(err);
  }
};
