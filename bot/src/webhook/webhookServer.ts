import express from 'express';
import { config } from '../config/environment';
import { handleCommentWebhook } from './commentReplyHandler';
import { logger } from '../utils/logger';

export function createWebhookServer(): express.Application {
  const app = express();

  app.use(express.json());

  app.post('/webhook', (req, res) => {
    const { postId, commentId, commentContent, commentAuthor, postAuthorUsername, parentCommentId } = req.body;

    if (!postId || !commentId || !commentContent || !commentAuthor || !postAuthorUsername) {
      logger.warn('Webhook request missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!commentAuthor.id || !commentAuthor.username || !commentAuthor.role) {
      logger.warn('Webhook request missing commentAuthor fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (config.bot.webhookSecret) {
      const providedSecret = req.headers['x-webhook-secret'] || req.headers['bot_webhook_secret'];
      if (providedSecret !== config.bot.webhookSecret) {
        logger.warn('Webhook request with invalid secret');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const payload = {
      postId,
      commentId,
      commentContent,
      commentAuthor: {
        id: commentAuthor.id,
        username: commentAuthor.username,
        role: commentAuthor.role,
      },
      postAuthorUsername,
      parentCommentId: parentCommentId || null,
    };

    handleCommentWebhook(payload).catch((error) => {
      logger.error('Unhandled error in webhook handler:', error);
    });

    return res.status(200).json({ success: true });
  });

  app.get('/health', (_req, res) => {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
