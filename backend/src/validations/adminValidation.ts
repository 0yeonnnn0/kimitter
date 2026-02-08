import Joi from 'joi';

export const createInvitationSchema = Joi.object({
  expiresAt: Joi.date().iso().optional(),
});

export const updateRoleSchema = Joi.object({
  role: Joi.string().valid('USER', 'ADMIN').required(),
});
