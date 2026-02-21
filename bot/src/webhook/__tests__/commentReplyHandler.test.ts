import {
  handleCommentWebhook,
  getBotTypeByUsername,
  WebhookPayload,
} from '../commentReplyHandler';
import * as openaiService from '../../services/openaiService';
import { KimitterClient } from '../../api/kimitterClient';

jest.mock('../../services/openaiService');
jest.mock('../../api/kimitterClient');

describe('commentReplyHandler', () => {
  let mockClient: jest.Mocked<KimitterClient>;

  beforeEach(() => {
    mockClient = {
      getComments: jest.fn(),
      createComment: jest.fn(),
      createReply: jest.fn(),
    } as unknown as jest.Mocked<KimitterClient>;

    jest.clearAllMocks();
  });

  describe('getBotTypeByUsername', () => {
    it('should return botType and client when username matches', () => {
      const typeMap = new Map<string, openaiService.BotType>([['stockbot', 'stock']]);
      const clients = new Map<openaiService.BotType, KimitterClient>([['stock', mockClient]]);

      const result = getBotTypeByUsername('stockbot', typeMap, clients);

      expect(result).toEqual({
        botType: 'stock',
        client: mockClient,
      });
    });

    it('should return null when username does not match', () => {
      const typeMap = new Map<string, openaiService.BotType>([['stockbot', 'stock']]);
      const clients = new Map<openaiService.BotType, KimitterClient>([['stock', mockClient]]);

      const result = getBotTypeByUsername('unknownuser', typeMap, clients);

      expect(result).toBeNull();
    });

    it('should return null when client is not initialized', () => {
      const typeMap = new Map<string, openaiService.BotType>([['stockbot', 'stock']]);
      const clients = new Map<openaiService.BotType, KimitterClient>();

      const result = getBotTypeByUsername('stockbot', typeMap, clients);

      expect(result).toBeNull();
    });
  });

  describe('handleCommentWebhook', () => {
    const basePayload: WebhookPayload = {
      postId: 1,
      commentId: 10,
      commentContent: 'What do you think about this?',
      commentAuthor: {
        id: 5,
        username: 'testuser',
        role: 'USER',
      },
      postAuthorUsername: 'stockbot',
      parentCommentId: null,
    };

    it('should ignore bot comments to prevent BOT→BOT interaction', async () => {
      const botPayload: WebhookPayload = {
        ...basePayload,
        commentAuthor: {
          id: 99,
          username: 'stock-bot',
          role: 'BOT',
        },
      };

      await handleCommentWebhook(botPayload);

      expect(openaiService.generateCommentReply).not.toHaveBeenCalled();
    });

    it('should log warning when post is not owned by any bot', async () => {
      const mockGetBotFn = jest.fn().mockReturnValue(null);

      await handleCommentWebhook(basePayload, mockGetBotFn);

      expect(openaiService.generateCommentReply).not.toHaveBeenCalled();
    });

    it('should generate reply and create comment when AI succeeds', async () => {
      const mockGenerateReply = jest
        .spyOn(openaiService, 'generateCommentReply')
        .mockResolvedValue('This is an AI-generated reply');

      const mockGetBotFn = jest.fn().mockReturnValue({
        botType: 'stock',
        client: mockClient,
      });

      mockClient.getComments.mockResolvedValue({
        comments: [
          {
            id: 8,
            content: 'Previous comment',
            author: { nickname: 'user1', role: 'USER' },
          },
        ],
      });

      mockClient.createComment.mockResolvedValue({});

      await handleCommentWebhook(basePayload, mockGetBotFn);

      expect(mockGenerateReply).toHaveBeenCalledWith(
        'stock',
        '',
        [{ nickname: 'user1', content: 'Previous comment', role: 'USER' }],
        'What do you think about this?',
      );
      expect(mockClient.createComment).toHaveBeenCalledWith(1, 'This is an AI-generated reply');
    });

    it('should create reply instead of comment when parentCommentId exists', async () => {
      const mockGenerateReply = jest
        .spyOn(openaiService, 'generateCommentReply')
        .mockResolvedValue('This is an AI-generated reply to a reply');

      const mockGetBotFn = jest.fn().mockReturnValue({
        botType: 'news',
        client: mockClient,
      });

      mockClient.getComments.mockResolvedValue({
        comments: [],
      });

      mockClient.createReply.mockResolvedValue({});

      const payloadWithParent: WebhookPayload = {
        ...basePayload,
        parentCommentId: 8,
      };

      await handleCommentWebhook(payloadWithParent, mockGetBotFn);

      expect(mockGenerateReply).toHaveBeenCalled();
      expect(mockClient.createReply).toHaveBeenCalledWith(
        10,
        'This is an AI-generated reply to a reply',
      );
      expect(mockClient.createComment).not.toHaveBeenCalled();
    });

    it('should log warning when AI generation fails', async () => {
      const mockGenerateReply = jest
        .spyOn(openaiService, 'generateCommentReply')
        .mockResolvedValue(null);

      const mockGetBotFn = jest.fn().mockReturnValue({
        botType: 'news',
        client: mockClient,
      });

      mockClient.getComments.mockResolvedValue({
        comments: [],
      });

      await handleCommentWebhook(basePayload, mockGetBotFn);

      expect(mockGenerateReply).toHaveBeenCalled();
      expect(mockClient.createComment).not.toHaveBeenCalled();
      expect(mockClient.createReply).not.toHaveBeenCalled();
    });

    it('should not throw errors when webhook processing fails', async () => {
      const mockGetBotFn = jest.fn().mockImplementation(() => { throw new Error('Unexpected error'); });

      await expect(handleCommentWebhook(basePayload, mockGetBotFn)).resolves.not.toThrow();
    });
  });
});
