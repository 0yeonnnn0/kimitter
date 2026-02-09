import Joi from 'joi';

export const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).allow('').optional(),
  tags: Joi.string().optional(),
});

export const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).optional(),
  tags: Joi.string().optional(),
});

export const searchSchema = Joi.object({
  q: Joi.string().optional(),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  mediaType: Joi.string().valid('PHOTO', 'GIF', 'VIDEO').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});
