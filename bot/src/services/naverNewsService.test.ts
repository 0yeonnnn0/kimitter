import axios from 'axios';
import {
  searchNews,
  stripHtmlTags,
  filterRecentNews,
  getGeneralNews,
  NewsItem,
} from './naverNewsService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('naverNewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('stripHtmlTags', () => {
    it('should remove HTML tags from text', () => {
      const input = '<b>태그</b>';
      const result = stripHtmlTags(input);
      expect(result).toBe('태그');
    });

    it('should handle multiple HTML tags', () => {
      const input = '<b>뉴스</b> <i>제목</i>';
      const result = stripHtmlTags(input);
      expect(result).toBe('뉴스 제목');
    });

    it('should return text unchanged if no HTML tags', () => {
      const input = '일반 텍스트';
      const result = stripHtmlTags(input);
      expect(result).toBe('일반 텍스트');
    });
  });

  describe('searchNews', () => {
    it('should send correct headers and params to Naver API', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: '<b>뉴스</b> 제목',
              originallink: 'https://example.com',
              link: 'https://example.com',
              description: '<b>설명</b>',
              pubDate: 'Thu, 13 Feb 2026 08:00:00 +0900',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await searchNews('정치', 20);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://openapi.naver.com/v1/search/news.json',
        {
          headers: {
            'X-Naver-Client-Id': expect.any(String),
            'X-Naver-Client-Secret': expect.any(String),
          },
          params: {
            query: '정치',
            display: 20,
            sort: 'date',
          },
        },
      );
    });

    it('should parse response and strip HTML tags', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: '<b>정치</b> 뉴스',
              originallink: 'https://example.com/1',
              link: 'https://example.com/1',
              description: '<b>정치</b> 관련 설명',
              pubDate: 'Thu, 13 Feb 2026 08:00:00 +0900',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchNews('정치');

      expect(result).toEqual([
        {
          title: '정치 뉴스',
          description: '정치 관련 설명',
          link: 'https://example.com/1',
          pubDate: 'Thu, 13 Feb 2026 08:00:00 +0900',
        },
      ]);
    });

    it('should return empty array on API failure', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await searchNews('정치');

      expect(result).toEqual([]);
    });

    it('should use default display value of 20', async () => {
      const mockResponse = { data: { items: [] } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await searchNews('뉴스');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            display: 20,
          }),
        }),
      );
    });
  });

  describe('filterRecentNews', () => {
    it('should keep news from the last 24 hours', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const items: NewsItem[] = [
        {
          title: '최근 뉴스',
          description: '1시간 전',
          link: 'https://example.com/1',
          pubDate: oneHourAgo.toUTCString(),
        },
      ];

      const result = filterRecentNews(items, 24);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('최근 뉴스');
    });

    it('should filter out news older than 24 hours', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const items: NewsItem[] = [
        {
          title: '최근 뉴스',
          description: '2시간 전',
          link: 'https://example.com/1',
          pubDate: twoHoursAgo.toUTCString(),
        },
        {
          title: '오래된 뉴스',
          description: '2일 전',
          link: 'https://example.com/2',
          pubDate: twoDaysAgo.toUTCString(),
        },
      ];

      const result = filterRecentNews(items, 24);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('최근 뉴스');
    });

    it('should handle custom hoursAgo parameter', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      const items: NewsItem[] = [
        {
          title: '1시간 전 뉴스',
          description: 'desc1',
          link: 'https://example.com/1',
          pubDate: oneHourAgo.toUTCString(),
        },
        {
          title: '3시간 전 뉴스',
          description: 'desc2',
          link: 'https://example.com/2',
          pubDate: threeHoursAgo.toUTCString(),
        },
      ];

      const result = filterRecentNews(items, 2);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('1시간 전 뉴스');
    });
  });

  describe('getGeneralNews', () => {
    it('should exclude political keywords from results', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const mockResponse = {
        data: {
          items: [
            {
              title: '일반 뉴스 1',
              originallink: 'https://example.com/1',
              link: 'https://example.com/1',
              description: '일반 설명',
              pubDate: oneHourAgo.toUTCString(),
            },
            {
              title: '정치 뉴스 (제외됨)',
              originallink: 'https://example.com/2',
              link: 'https://example.com/2',
              description: '정치 설명',
              pubDate: oneHourAgo.toUTCString(),
            },
            {
              title: '국회 뉴스 (제외됨)',
              originallink: 'https://example.com/3',
              link: 'https://example.com/3',
              description: '국회 설명',
              pubDate: oneHourAgo.toUTCString(),
            },
            {
              title: '일반 뉴스 2',
              originallink: 'https://example.com/4',
              link: 'https://example.com/4',
              description: '일반 설명',
              pubDate: oneHourAgo.toUTCString(),
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getGeneralNews();

      expect(result).toHaveLength(2);
      expect(result.every((item) => !item.title.includes('정치') && !item.title.includes('국회'))).toBe(true);
    });

    it('should exclude stock keywords from results', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const mockResponse = {
        data: {
          items: [
            {
              title: '일반 뉴스',
              originallink: 'https://example.com/1',
              link: 'https://example.com/1',
              description: '일반 설명',
              pubDate: oneHourAgo.toUTCString(),
            },
            {
              title: '코스피 상승 (제외됨)',
              originallink: 'https://example.com/2',
              link: 'https://example.com/2',
              description: '주식 설명',
              pubDate: oneHourAgo.toUTCString(),
            },
            {
              title: '코스닥 하락 (제외됨)',
              originallink: 'https://example.com/3',
              link: 'https://example.com/3',
              description: '주식 설명',
              pubDate: oneHourAgo.toUTCString(),
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getGeneralNews();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('일반 뉴스');
    });

    it('should call searchNews with correct query and display', async () => {
      const mockResponse = { data: { items: [] } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await getGeneralNews();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            query: '한국 뉴스',
            display: 50,
          }),
        }),
      );
    });

    it('should return up to 10 items', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const mockResponse = {
        data: {
          items: Array.from({ length: 50 }, (_, i) => ({
            title: `일반 뉴스 ${i + 1}`,
            originallink: `https://example.com/${i + 1}`,
            link: `https://example.com/${i + 1}`,
            description: `설명 ${i + 1}`,
            pubDate: oneHourAgo.toUTCString(),
          })),
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getGeneralNews();

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });
});
