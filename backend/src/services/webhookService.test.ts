import axios from 'axios';
import { sendBotWebhook, WebhookPayload } from './webhookService';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

jest.mock('axios');
jest.mock('../config/environment', () => ({
  config: {
    botWebhookUrl: 'http://localhost:4000/webhook',
  },
}));
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('webhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendBotWebhook', () => {
    const mockPayload: WebhookPayload = {
      postId: 1,
      commentId: 10,
      commentContent: 'Test comment',
      commentAuthor: { id: 2, username: 'testuser', role: 'USER' },
      postAuthorUsername: 'stockbot',
      parentCommentId: null,
    };

    it('should send correct payload via POST to webhook URL', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendBotWebhook(mockPayload);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/webhook',
        mockPayload,
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
        },
      );
      expect(logger.info).toHaveBeenCalledWith('Webhook sent successfully', {
        postId: 1,
        commentId: 10,
      });
    });

    it('should skip without error when BOT_WEBHOOK_URL is empty', async () => {
      const originalUrl = config.botWebhookUrl;
      (config as any).botWebhookUrl = '';

      await sendBotWebhook(mockPayload);

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('No webhook URL configured, skipping');

      (config as any).botWebhookUrl = originalUrl;
    });

    it('should log error but not throw when HTTP request fails', async () => {
      const mockError = new Error('Network error');
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(sendBotWebhook(mockPayload)).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith('Webhook dispatch failed', {
        error: mockError,
        payload: mockPayload,
      });
    });
  });
});
