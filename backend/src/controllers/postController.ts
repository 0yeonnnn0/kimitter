import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/postService';
import * as notificationService from '../services/notificationService';

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const post = await postService.createPost(
      req.userId!,
      req.body.content,
      req.body.tags,
      files,
    );
    res.status(201).json({ success: true, data: post });

    if (req.userRole !== 'ADMIN' && req.userRole !== 'BOT') {
      notificationService.notifyNewPost(req.userId!, post.id).catch(() => {});
    }
  } catch (err) {
    next(err);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await postService.getPosts(page, limit, req.userId!);
    res.json({
      success: true,
      data: result.posts,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await postService.getPostById(Number(req.params.postId), req.userId!);
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await postService.updatePost(
      Number(req.params.postId),
      req.userId!,
      req.body.content,
      req.body.tags,
    );
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await postService.deletePost(Number(req.params.postId), req.userId!, req.userRole!);
    res.json({ success: true, data: { message: 'Post deleted' } });
  } catch (err) {
    next(err);
  }
};

export const searchPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await postService.searchPosts(
      page,
      limit,
      req.userId!,
      req.query.q as string | undefined,
      req.query.month as string | undefined,
      req.query.mediaType as string | undefined,
      req.query.mediaOnly === 'true',
    );
    res.json({
      success: true,
      data: result.posts,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};
