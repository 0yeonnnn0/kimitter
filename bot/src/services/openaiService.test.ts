import { prompts } from '../config/prompts';
import { logger } from '../utils/logger';

jest.mock('../utils/logger');

const mockCreate = jest.fn();
const mockOpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}));

jest.mock('openai', () => mockOpenAI);

import {
  generatePostContent,
  generateCommentReply,
  resetOpenAIClient,
} from './openaiService';

describe('openaiService', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockOpenAI.mockClear();
    resetOpenAIClient();
  });

  describe('generatePostContent', () => {
    it('should generate stock post content with correct prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '📊 삼성전자 주가 분석...',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generatePostContent('stock', '삼성전자 최근 뉴스');

      expect(mockCreate).toHaveBeenCalled();
      expect(result).toBe('📊 삼성전자 주가 분석...');
      expect(mockCreate).toHaveBeenCalledWith({
        model: expect.any(String),
        messages: [
          { role: 'system', content: prompts.stockPost },
          { role: 'user', content: '삼성전자 최근 뉴스' },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('stock post'),
      );
    });

    it('should generate politics post content with correct prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '🏛️ 오늘의 정치 뉴스...',
            },
          },
        ],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 250,
          total_tokens: 370,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generatePostContent('politics', '정치 뉴스 데이터');

      expect(result).toBe('🏛️ 오늘의 정치 뉴스...');
      expect(mockCreate).toHaveBeenCalledWith({
        model: expect.any(String),
        messages: [
          { role: 'system', content: prompts.politicsPost },
          { role: 'user', content: '정치 뉴스 데이터' },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('politics post'),
      );
    });

    it('should generate news post content with correct prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '📰 오늘의 주요 뉴스...',
            },
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 300,
          total_tokens: 450,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generatePostContent('news', '일반 뉴스 데이터');

      expect(result).toBe('📰 오늘의 주요 뉴스...');
      expect(mockCreate).toHaveBeenCalledWith({
        model: expect.any(String),
        messages: [
          { role: 'system', content: prompts.newsPost },
          { role: 'user', content: '일반 뉴스 데이터' },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('news post'),
      );
    });

    it('should return null on OpenAI API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await generatePostContent('stock', '테스트 데이터');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate stock post'),
        expect.any(Error),
      );
    });

    it('should log token usage', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test content',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await generatePostContent('stock', 'test data');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringMatching(/prompt=100.*completion=200.*total=300/),
      );
    });
  });

  describe('generateCommentReply', () => {
    it('should generate reply with post content and comment thread', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '좋은 질문입니다. 주가는...',
            },
          },
        ],
        usage: {
          prompt_tokens: 80,
          completion_tokens: 120,
          total_tokens: 200,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const postContent = '📊 삼성전자 주가 상승';
      const commentThread = [
        { nickname: '아빠', content: '좋은 정보네요', role: 'user' },
        { nickname: 'stock-bot', content: '감사합니다', role: 'assistant' },
      ];
      const userComment = '내일도 오를까요?';

      const result = await generateCommentReply(
        'stock',
        postContent,
        commentThread,
        userComment,
      );

      expect(result).toBe('좋은 질문입니다. 주가는...');
      expect(mockCreate).toHaveBeenCalledWith({
        model: expect.any(String),
        messages: [
          { role: 'system', content: prompts.stockReply },
          {
            role: 'user',
            content: expect.stringContaining(postContent),
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const userMessageArg = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessageArg).toContain('게시물 내용:');
      expect(userMessageArg).toContain(postContent);
      expect(userMessageArg).toContain('댓글 맥락:');
      expect(userMessageArg).toContain('[user] 아빠: 좋은 정보네요');
      expect(userMessageArg).toContain('[assistant] stock-bot: 감사합니다');
      expect(userMessageArg).toContain('새 댓글: 내일도 오를까요?');
    });

    it('should return null on OpenAI API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await generateCommentReply(
        'politics',
        '게시물 내용',
        [],
        '댓글',
      );

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate politics comment reply'),
        expect.any(Error),
      );
    });

    it('should log token usage for replies', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Reply content',
            },
          },
        ],
        usage: {
          prompt_tokens: 80,
          completion_tokens: 120,
          total_tokens: 200,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await generateCommentReply('news', 'Post content', [], 'User comment');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringMatching(/news reply.*prompt=80.*completion=120.*total=200/),
      );
    });
  });
});
