import { PoliticsBot } from './politicsBot';
import { KimitterClient } from '../api/kimitterClient';
import { getPoliticalNews } from '../services/naverNewsService';
import { generatePostContent } from '../services/openaiService';
import { logger } from '../utils/logger';

jest.mock('../api/kimitterClient');
jest.mock('../services/naverNewsService');
jest.mock('../services/openaiService');
jest.mock('../utils/logger');

describe('PoliticsBot', () => {
  let politicsBot: PoliticsBot;
  let mockClient: jest.Mocked<KimitterClient>;

  beforeEach(() => {
    mockClient = new KimitterClient({
      apiUrl: 'http://test.com',
      username: 'test',
      password: 'test',
    }) as jest.Mocked<KimitterClient>;

    politicsBot = new PoliticsBot(mockClient);
  });

  describe('getType', () => {
    it('should return politics', () => {
      expect(politicsBot.getType()).toBe('politics');
    });
  });

  describe('generatePost - happy path', () => {
    it('should fetch data, generate content, and create post', async () => {
      const mockNewsItems = [
        {
          title: '국회 예산안 통과',
          description: '여야 합의로 예산안이 통과되었습니다',
          link: 'https://news.example.com/1',
          pubDate: new Date().toISOString(),
        },
        {
          title: '대통령 기자회견',
          description: '대통령이 오늘 기자회견을 가졌습니다',
          link: 'https://news.example.com/2',
          pubDate: new Date().toISOString(),
        },
      ];

      const mockContent = '오늘의 주요 정치 뉴스입니다';

      (getPoliticalNews as jest.Mock).mockResolvedValue(mockNewsItems);
      (generatePostContent as jest.Mock).mockResolvedValue(mockContent);
      mockClient.getMyPosts = jest.fn().mockResolvedValue({ posts: [] });
      mockClient.createPost = jest.fn().mockResolvedValue({});

      await politicsBot.generatePost();

      expect(getPoliticalNews).toHaveBeenCalled();
      expect(generatePostContent).toHaveBeenCalledWith(
        'politics',
        expect.stringContaining('국회 예산안 통과'),
      );
      expect(mockClient.createPost).toHaveBeenCalledWith(mockContent, ['정치', '뉴스']);
      expect(logger.info).toHaveBeenCalledWith('Successfully posted politics update');
    });
  });

  describe('generatePost - no data available', () => {
    it('should log warning and not create post when no news available', async () => {
      (getPoliticalNews as jest.Mock).mockResolvedValue([]);
      mockClient.createPost = jest.fn();

      await politicsBot.generatePost();

      expect(logger.warn).toHaveBeenCalledWith('No political news available');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - AI returns null', () => {
    it('should log warning and not create post when OpenAI returns null', async () => {
      const mockNewsItems = [
        {
          title: '국회 예산안 통과',
          description: '여야 합의로 예산안이 통과되었습니다',
          link: 'https://news.example.com/1',
          pubDate: new Date().toISOString(),
        },
      ];

      (getPoliticalNews as jest.Mock).mockResolvedValue(mockNewsItems);
      (generatePostContent as jest.Mock).mockResolvedValue(null);
      mockClient.createPost = jest.fn();

      await politicsBot.generatePost();

      expect(logger.warn).toHaveBeenCalledWith('OpenAI returned null for politics post');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - duplicate check', () => {
    it('should skip posting if already posted today', async () => {
      const mockNewsItems = [
        {
          title: '국회 예산안 통과',
          description: '여야 합의로 예산안이 통과되었습니다',
          link: 'https://news.example.com/1',
          pubDate: new Date().toISOString(),
        },
      ];

      const mockContent = '오늘의 주요 정치 뉴스입니다';

      const today = new Date();
      const mockPosts = {
        posts: [
          {
            id: 1,
            content: '어제의 정치 뉴스',
            createdAt: today.toISOString(),
          },
        ],
      };

      (getPoliticalNews as jest.Mock).mockResolvedValue(mockNewsItems);
      (generatePostContent as jest.Mock).mockResolvedValue(mockContent);
      mockClient.getMyPosts = jest.fn().mockResolvedValue(mockPosts);
      mockClient.createPost = jest.fn();

      await politicsBot.generatePost();

      expect(logger.info).toHaveBeenCalledWith('Already posted today, skipping politics post');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - external API failure', () => {
    it('should log error and not throw when API fails', async () => {
      const error = new Error('API failure');
      (getPoliticalNews as jest.Mock).mockRejectedValue(error);

      await expect(politicsBot.generatePost()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith('Error generating politics post:', error);
    });
  });
});
