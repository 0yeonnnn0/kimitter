import axios from 'axios';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface WebhookPayload {
  postId: number;
  commentId: number;
  commentContent: string;
  commentAuthor: { id: number; username: string; role: string };
  postAuthorUsername: string;
  parentCommentId: number | null;
}

export const sendBotWebhook = async (payload: WebhookPayload): Promise<void> => {
  const webhookUrl = config.botWebhookUrl;

  if (!webhookUrl) {
    logger.info('No webhook URL configured, skipping');
    return;
  }

  try {
    await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
    logger.info('Webhook sent successfully', {
      postId: payload.postId,
      commentId: payload.commentId,
    });
  } catch (error) {
    logger.error('Webhook dispatch failed', { error, payload });
  }
};
