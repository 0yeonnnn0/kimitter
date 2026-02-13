import { NewsBot } from './newsBot';
import { KimitterClient } from '../api/kimitterClient';
import { getGeneralNews } from '../services/naverNewsService';
import { generatePostContent } from '../services/openaiService';
import { logger } from '../utils/logger';

jest.mock('../api/kimitterClient');
jest.mock('../services/naverNewsService');
jest.mock('../services/openaiService');
jest.mock('../utils/logger');

describe('NewsBot', () => {
  let newsBot: NewsBot;
  let mockClient: jest.Mocked<KimitterClient>;

  beforeEach(() => {
    mockClient = new KimitterClient({
      apiUrl: 'http://test.com',
      username: 'test',
      password: 'test',
    }) as jest.Mocked<KimitterClient>;

    newsBot = new NewsBot(mockClient);
  });

  describe('getType', () => {
    it('should return news', () => {
      expect(newsBot.getType()).toBe('news');
    });
  });

  describe('generatePost - happy path', () => {
    it('should fetch data, generate content, and create post', async () => {
      const mockNewsItems = [
        {
          title: '서울시 새로운 정책 발표',
          description: '서울시가 새로운 정책을 발표했습니다',
          link: 'https://news.example.com/1',
          pubDate: new Date().toISOString(),
        },
        {
          title: '날씨 예보',
          description: '내일은 맑은 날씨가 예상됩니다',
          link: 'https://news.example.com/2',
          pubDate: new Date().toISOString(),
        },
      ];

      const mockContent = '오늘의 주요 뉴스입니다';

      (getGeneralNews as jest.Mock).mockResolvedValue(mockNewsItems);
      (generatePostContent as jest.Mock).mockResolvedValue(mockContent);
      mockClient.getMyPosts = jest.fn().mockResolvedValue({ posts: [] });
      mockClient.createPost = jest.fn().mockResolvedValue({});

      await newsBot.generatePost();

      expect(getGeneralNews).toHaveBeenCalled();
      expect(generatePostContent).toHaveBeenCalledWith(
        'news',
        expect.stringContaining('서울시 새로운 정책 발표'),
      );
      expect(mockClient.createPost).toHaveBeenCalledWith(mockContent, ['뉴스']);
      expect(logger.info).toHaveBeenCalledWith('Successfully posted news update');
    });
  });

  describe('generatePost - no data available', () => {
    it('should log warning and not create post when no news available', async () => {
      (getGeneralNews as jest.Mock).mockResolvedValue([]);
      mockClient.createPost = jest.fn();

      await newsBot.generatePost();

      expect(logger.warn).toHaveBeenCalledWith('No general news available');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - AI returns null', () => {
    it('should log warning and not create post when OpenAI returns null', async () => {
      const mockNewsItems = [
        {
          title: '서울시 새로운 정책 발표',
          description: '서울시가 새로운 정책을 발표했습니다',
          link: 'https://news.example.com/1',
          pubDate: new Date().toISOString(),
        },
      ];

      (getGeneralNews as jest.Mock).mockResolvedValue(mockNewsItems);
      (generatePostContent as jest.Mock).mockResolvedValue(null);
      mockClient.createPost = jest.fn();

      await newsBot.generatePost();

      expect(logger.warn).toHaveBeenCalledWith('OpenAI returned null for news post');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - duplicate check', () => {
    it('should skip posting if already posted today', async () => {
      const mockNewsItems = [
        {
          title: '서울시 새로운 정책 발표',
          description: '서울시가 새로운 정책을 발표했습니다',
          link: 'https://news.example.com/1',
          pubDate: new Date().toISOString(),
        },
      ];

      const mockContent = '오늘의 주요 뉴스입니다';

      const today = new Date();
      const mockPosts = {
        posts: [
          {
            id: 1,
            content: '어제의 뉴스',
            createdAt: today.toISOString(),
          },
        ],
      };

      (getGeneralNews as jest.Mock).mockResolvedValue(mockNewsItems);
      (generatePostContent as jest.Mock).mockResolvedValue(mockContent);
      mockClient.getMyPosts = jest.fn().mockResolvedValue(mockPosts);
      mockClient.createPost = jest.fn();

      await newsBot.generatePost();

      expect(logger.info).toHaveBeenCalledWith('Already posted today, skipping news post');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - external API failure', () => {
    it('should log error and not throw when API fails', async () => {
      const error = new Error('API failure');
      (getGeneralNews as jest.Mock).mockRejectedValue(error);

      await expect(newsBot.generatePost()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith('Error generating news post:', error);
    });
  });
});
