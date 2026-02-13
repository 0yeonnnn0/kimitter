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

      const topStock = trendingStocks[0];
      const stockDetail = await stockService.getStockPrice(topStock.ticker);

      if (!stockDetail) {
        logger.warn(`Failed to get stock price for ${topStock.ticker}`);
        return;
      }

      const rawData = `종목명: ${stockDetail.name}
현재가: ₩${stockDetail.currentPrice.toLocaleString()}
전일대비: ${stockDetail.changeRate > 0 ? '+' : ''}${stockDetail.changeRate}%
거래량: ${stockDetail.volume.toLocaleString()}
거래량 순위: ${topStock.rank}`;

      const content = await generatePostContent('stock', rawData);

      if (!content) {
        logger.warn('OpenAI returned null for stock post');
        return;
      }

      const isDuplicate = await this.hasPostedAboutStockToday(stockDetail.name);
      if (isDuplicate) {
        logger.info(`Already posted about ${stockDetail.name} today, skipping`);
        return;
      }

      await this.client.createPost(content, ['주식', '경제', stockDetail.name]);
      logger.info(`Successfully posted stock update for ${stockDetail.name}`);
    } catch (error) {
      logger.error('Error generating stock post:', error);
    }
  }

  private async hasPostedAboutStockToday(stockName: string): Promise<boolean> {
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

        if (postDateKST.getTime() === todayKST.getTime() && post.content.includes(stockName)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
