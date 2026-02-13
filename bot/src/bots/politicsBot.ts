import { KimitterClient } from '../api/kimitterClient';
import { getPoliticalNews } from '../services/naverNewsService';
import { generatePostContent } from '../services/openaiService';
import { logger } from '../utils/logger';
import { BaseBot, BotType, hasPostedToday } from './baseBot';

export class PoliticsBot implements BaseBot {
  private client: KimitterClient;

  constructor(client: KimitterClient) {
    this.client = client;
  }

  getType(): BotType {
    return 'politics';
  }

  async generatePost(): Promise<void> {
    try {
      const newsItems = await getPoliticalNews();

      if (newsItems.length === 0) {
        logger.warn('No political news available');
        return;
      }

      const rawData = newsItems
        .map((item) => {
          return `제목: ${item.title}\n설명: ${item.description}\n출처: ${item.link}`;
        })
        .join('\n\n');

      const content = await generatePostContent('politics', rawData);

      if (!content) {
        logger.warn('OpenAI returned null for politics post');
        return;
      }

      const isDuplicate = await hasPostedToday(this.client);
      if (isDuplicate) {
        logger.info('Already posted today, skipping politics post');
        return;
      }

      await this.client.createPost(content, ['정치', '뉴스']);
      logger.info('Successfully posted politics update');
    } catch (error) {
      logger.error('Error generating politics post:', error);
    }
  }
}
