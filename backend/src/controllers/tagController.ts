import { Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tagService';

export const getAllTags = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await tagService.getAllTags();
    res.json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
};

export const getPopularTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const tags = await tagService.getPopularTags(limit);
    res.json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
};

export const searchTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await tagService.searchTags((req.query.q as string) || '');
    res.json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
};

export const getPostsByTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const result = await tagService.getPostsByTag(req.params.tagName, page, limit);
    res.json({
      success: true,
      data: result.posts,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};
