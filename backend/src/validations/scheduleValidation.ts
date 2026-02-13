import Joi from 'joi';

export const getByMonthSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).required(),
});

export const getByDateSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

export const createScheduleSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  memo: Joi.string().trim().max(500).allow('', null).optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateScheduleSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional(),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  memo: Joi.string().trim().max(500).allow('', null).optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
});
