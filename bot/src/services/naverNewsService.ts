import axios from 'axios';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

interface NaverNewsResponse {
  items: Array<{
    title: string;
    originallink: string;
    link: string;
    description: string;
    pubDate: string;
  }>;
}

/**
 * Remove HTML tags from text (e.g., <b>태그</b> → 태그)
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Search news from Naver News API
 */
export async function searchNews(query: string, display: number = 20): Promise<NewsItem[]> {
  try {
    const response = await axios.get<NaverNewsResponse>(
      'https://openapi.naver.com/v1/search/news.json',
      {
        headers: {
          'X-Naver-Client-Id': config.naver.clientId,
          'X-Naver-Client-Secret': config.naver.clientSecret,
        },
        params: {
          query,
          display,
          sort: 'date',
        },
      },
    );

    return response.data.items.map((item) => ({
      title: stripHtmlTags(item.title),
      description: stripHtmlTags(item.description),
      link: item.link,
      pubDate: item.pubDate,
    }));
  } catch (error) {
    logger.error(`Failed to search news for query "${query}":`, error);
    return [];
  }
}

/**
 * Filter news items to only include those from the last N hours
 */
export function filterRecentNews(items: NewsItem[], hoursAgo: number = 24): NewsItem[] {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  return items.filter((item) => {
    const pubDate = new Date(item.pubDate);
    return pubDate >= cutoffTime;
  });
}

/**
 * Get political news (한국 정치)
 */
export async function getPoliticalNews(): Promise<NewsItem[]> {
  const items = await searchNews('한국 정치', 30);
  const recentItems = filterRecentNews(items, 24);
  return recentItems.slice(0, 10);
}

/**
 * Get general news (한국 뉴스) excluding political/stock keywords
 */
export async function getGeneralNews(): Promise<NewsItem[]> {
  const items = await searchNews('한국 뉴스', 50);
  const recentItems = filterRecentNews(items, 24);

  const excludeKeywords = ['정치', '국회', '대통령', '여당', '야당', '주식', '코스피', '코스닥', '증시'];

  const filtered = recentItems.filter((item) => {
    return !excludeKeywords.some((keyword) => item.title.includes(keyword));
  });

  return filtered.slice(0, 10);
}
