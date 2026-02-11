import Joi from 'joi';

export const sendNotificationSchema = Joi.object({
  recipientIds: Joi.array().items(Joi.number().integer()).min(1).required(),
  message: Joi.string().max(500).optional(),
});

export const broadcastNotificationSchema = Joi.object({
  message: Joi.string().min(1).max(80).required(),
});

export const registerTokenSchema = Joi.object({
  token: Joi.string().required(),
  deviceType: Joi.string().valid('IOS', 'ANDROID').required(),
});
