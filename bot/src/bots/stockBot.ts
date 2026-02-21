import { KimitterClient } from '../api/kimitterClient';
import { KisStockService } from '../services/kisStockService';
import { generatePostContent } from '../services/openaiService';
import { logger } from '../utils/logger';
import { BaseBot, BotType } from './baseBot';

interface Post {
  id: number;
  content: string;
  createdAt: string;
}

interface PostsResponse {
  posts: Post[];
}

export class StockBot implements BaseBot {
  private client: KimitterClient;

  constructor(client: KimitterClient) {
    this.client = client;
  }

  getType(): BotType {
    return 'stock';
  }

  async generatePost(): Promise<void> {
    try {
      const stockService = new KisStockService();
      const trendingStocks = await stockService.getTrendingStocks(5);

      if (trendingStocks.length === 0) {
        logger.warn('No trending stocks available');
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = `${yesterday.getFullYear()}.${String(yesterday.getMonth() + 1).padStart(2, '0')}.${String(yesterday.getDate()).padStart(2, '0')}`;

      const stockList = trendingStocks
        .map((stock) => {
          const sign = stock.changeRate > 0 ? '▲' : stock.changeRate < 0 ? '▼' : '-';
          return `${stock.rank}. ${stock.name} | ₩${stock.currentPrice.toLocaleString()} | ${sign} ${Math.abs(stock.changeRate)}% | 거래량 ${stock.volume.toLocaleString()}`;
        })
        .join('\n');

      const rawData = `날짜: ${dateStr}\n${stockList}`;

      const content = await generatePostContent('stock', rawData);

      if (!content) {
        logger.warn('OpenAI returned null for stock post');
        return;
      }

      const isDuplicate = await this.hasPostedToday();
      if (isDuplicate) {
        logger.info('Already posted stock update today, skipping');
        return;
      }

      await this.client.createPost(content, ['주식', '경제']);
      logger.info('Successfully posted stock update');
    } catch (error) {
      logger.error('Error generating stock post:', error);
    }
  }

  private async hasPostedToday(): Promise<boolean> {
    try {
      const response = await this.client.getMyPosts(1, 5);
      const postsData = response as PostsResponse;
      const posts = postsData.posts || [];

      const now = new Date();
      const kstOffset = 9 * 60;
      const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
      const todayKST = new Date(kstTime.getFullYear(), kstTime.getMonth(), kstTime.getDate());

      for (const post of posts) {
        const postDate = new Date(post.createdAt);
        const postKstTime = new Date(postDate.getTime() + kstOffset * 60 * 1000);
        const postDateKST = new Date(
          postKstTime.getFullYear(),
          postKstTime.getMonth(),
          postKstTime.getDate(),
        );

        if (postDateKST.getTime() === todayKST.getTime()) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
