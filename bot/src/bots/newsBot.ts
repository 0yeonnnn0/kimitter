import { KimitterClient } from '../api/kimitterClient';
import { getGeneralNews } from '../services/naverNewsService';
import { generatePostContent } from '../services/openaiService';
import { logger } from '../utils/logger';
import { BaseBot, BotType, hasPostedToday } from './baseBot';

export class NewsBot implements BaseBot {
  private client: KimitterClient;

  constructor(client: KimitterClient) {
    this.client = client;
  }

  getType(): BotType {
    return 'news';
  }

  async generatePost(): Promise<void> {
    try {
      const newsItems = await getGeneralNews();

      if (newsItems.length === 0) {
        logger.warn('No general news available');
        return;
      }

      const rawData = newsItems
        .map((item) => {
          return `제목: ${item.title}\n설명: ${item.description}\n출처: ${item.link}`;
        })
        .join('\n\n');

      const content = await generatePostContent('news', rawData);

      if (!content) {
        logger.warn('OpenAI returned null for news post');
        return;
      }

      const isDuplicate = await hasPostedToday(this.client);
      if (isDuplicate) {
        logger.info('Already posted today, skipping news post');
        return;
      }

      await this.client.createPost(content, ['뉴스']);
      logger.info('Successfully posted news update');
    } catch (error) {
      logger.error('Error generating news post:', error);
    }
  }
}
