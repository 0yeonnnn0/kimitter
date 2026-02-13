import { StockBot } from './stockBot';
import { KimitterClient } from '../api/kimitterClient';
import { KisStockService } from '../services/kisStockService';
import { generatePostContent } from '../services/openaiService';
import { logger } from '../utils/logger';

jest.mock('../api/kimitterClient');
jest.mock('../services/kisStockService');
jest.mock('../services/openaiService');
jest.mock('../utils/logger');

describe('StockBot', () => {
  let stockBot: StockBot;
  let mockClient: jest.Mocked<KimitterClient>;
  let mockStockService: jest.Mocked<KisStockService>;

  beforeEach(() => {
    mockClient = new KimitterClient({
      apiUrl: 'http://test.com',
      username: 'test',
      password: 'test',
    }) as jest.Mocked<KimitterClient>;

    stockBot = new StockBot(mockClient);

    mockStockService = {
      getTrendingStocks: jest.fn(),
      getStockPrice: jest.fn(),
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<KisStockService>;

    (KisStockService as jest.MockedClass<typeof KisStockService>).mockImplementation(
      () => mockStockService,
    );
  });

  describe('getType', () => {
    it('should return stock', () => {
      expect(stockBot.getType()).toBe('stock');
    });
  });

  describe('generatePost - happy path', () => {
    it('should fetch data, generate content, and create post', async () => {
      const mockTrendingStocks = [
        {
          ticker: '005930',
          name: '삼성전자',
          currentPrice: 70000,
          changeRate: 2.5,
          volume: 10000000,
          rank: 1,
        },
      ];

      const mockStockDetail = {
        ticker: '005930',
        name: '삼성전자',
        currentPrice: 70000,
        changeRate: 2.5,
        changeAmount: 1700,
        volume: 10000000,
      };

      const mockContent = '삼성전자가 오늘 급등했습니다!';

      mockStockService.getTrendingStocks.mockResolvedValue(mockTrendingStocks);
      mockStockService.getStockPrice.mockResolvedValue(mockStockDetail);
      (generatePostContent as jest.Mock).mockResolvedValue(mockContent);
      mockClient.getMyPosts = jest.fn().mockResolvedValue({ posts: [] });
      mockClient.createPost = jest.fn().mockResolvedValue({});

      await stockBot.generatePost();

      expect(mockStockService.getTrendingStocks).toHaveBeenCalledWith(5);
      expect(mockStockService.getStockPrice).toHaveBeenCalledWith('005930');
      expect(generatePostContent).toHaveBeenCalledWith(
        'stock',
        expect.stringContaining('삼성전자'),
      );
      expect(mockClient.createPost).toHaveBeenCalledWith(mockContent, [
        '주식',
        '경제',
        '삼성전자',
      ]);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully posted stock update'),
      );
    });
  });

  describe('generatePost - no data available', () => {
    it('should log warning and not create post when no trending stocks', async () => {
      mockStockService.getTrendingStocks.mockResolvedValue([]);
      mockClient.createPost = jest.fn();

      await stockBot.generatePost();

      expect(logger.warn).toHaveBeenCalledWith('No trending stocks available');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });

    it('should log warning and not create post when stock detail is null', async () => {
      const mockTrendingStocks = [
        {
          ticker: '005930',
          name: '삼성전자',
          currentPrice: 70000,
          changeRate: 2.5,
          volume: 10000000,
          rank: 1,
        },
      ];

      mockStockService.getTrendingStocks.mockResolvedValue(mockTrendingStocks);
      mockStockService.getStockPrice.mockResolvedValue(null);
      mockClient.createPost = jest.fn();

      await stockBot.generatePost();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to get stock price'));
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - AI returns null', () => {
    it('should log warning and not create post when OpenAI returns null', async () => {
      const mockTrendingStocks = [
        {
          ticker: '005930',
          name: '삼성전자',
          currentPrice: 70000,
          changeRate: 2.5,
          volume: 10000000,
          rank: 1,
        },
      ];

      const mockStockDetail = {
        ticker: '005930',
        name: '삼성전자',
        currentPrice: 70000,
        changeRate: 2.5,
        changeAmount: 1700,
        volume: 10000000,
      };

      mockStockService.getTrendingStocks.mockResolvedValue(mockTrendingStocks);
      mockStockService.getStockPrice.mockResolvedValue(mockStockDetail);
      (generatePostContent as jest.Mock).mockResolvedValue(null);
      mockClient.createPost = jest.fn();

      await stockBot.generatePost();

      expect(logger.warn).toHaveBeenCalledWith('OpenAI returned null for stock post');
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - duplicate check', () => {
    it('should skip posting if already posted about same stock today', async () => {
      const mockTrendingStocks = [
        {
          ticker: '005930',
          name: '삼성전자',
          currentPrice: 70000,
          changeRate: 2.5,
          volume: 10000000,
          rank: 1,
        },
      ];

      const mockStockDetail = {
        ticker: '005930',
        name: '삼성전자',
        currentPrice: 70000,
        changeRate: 2.5,
        changeAmount: 1700,
        volume: 10000000,
      };

      const mockContent = '삼성전자가 오늘 급등했습니다!';

      const today = new Date();
      const mockPosts = {
        posts: [
          {
            id: 1,
            content: '삼성전자가 어제도 좋았어요',
            createdAt: today.toISOString(),
          },
        ],
      };

      mockStockService.getTrendingStocks.mockResolvedValue(mockTrendingStocks);
      mockStockService.getStockPrice.mockResolvedValue(mockStockDetail);
      (generatePostContent as jest.Mock).mockResolvedValue(mockContent);
      mockClient.getMyPosts = jest.fn().mockResolvedValue(mockPosts);
      mockClient.createPost = jest.fn();

      await stockBot.generatePost();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Already posted about 삼성전자 today'),
      );
      expect(mockClient.createPost).not.toHaveBeenCalled();
    });
  });

  describe('generatePost - external API failure', () => {
    it('should log error and not throw when API fails', async () => {
      const error = new Error('API failure');
      mockStockService.getTrendingStocks.mockRejectedValue(error);

      await expect(stockBot.generatePost()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith('Error generating stock post:', error);
    });
  });
});
