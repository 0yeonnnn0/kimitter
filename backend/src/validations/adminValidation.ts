import Joi from 'joi';

export const createInvitationSchema = Joi.object({
  expiresAt: Joi.date().iso().optional(),
});

export const inviteByEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const updateRoleSchema = Joi.object({
  role: Joi.string().valid('USER', 'ADMIN', 'BOT').required(),
});
