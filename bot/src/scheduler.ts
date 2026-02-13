import cron from 'node-cron';
import { config } from './config/environment';
import { StockBot } from './bots/stockBot';
import { PoliticsBot } from './bots/politicsBot';
import { NewsBot } from './bots/newsBot';
import { KimitterClient } from './api/kimitterClient';
import { logger } from './utils/logger';

export interface ScheduledTask {
  name: string;
  cronExpression: string;
  task: cron.ScheduledTask;
}

export class BotScheduler {
  private tasks: ScheduledTask[] = [];
  private clients: Map<string, KimitterClient> = new Map();

  async initialize(): Promise<void> {
    logger.info('Initializing bot clients...');

    const stockClient = new KimitterClient({
      apiUrl: config.kimitter.apiUrl,
      username: config.bots.stock.username,
      password: config.bots.stock.password,
    });

    const politicsClient = new KimitterClient({
      apiUrl: config.kimitter.apiUrl,
      username: config.bots.politics.username,
      password: config.bots.politics.password,
    });

    const newsClient = new KimitterClient({
      apiUrl: config.kimitter.apiUrl,
      username: config.bots.news.username,
      password: config.bots.news.password,
    });

    await stockClient.login();
    await politicsClient.login();
    await newsClient.login();

    this.clients.set('stock', stockClient);
    this.clients.set('politics', politicsClient);
    this.clients.set('news', newsClient);

    logger.info('All bot clients initialized and logged in');
  }

  start(): void {
    if (!config.bot.enabled) {
      logger.info('Bot scheduler disabled');
      return;
    }

    const stockClient = this.clients.get('stock');
    const politicsClient = this.clients.get('politics');
    const newsClient = this.clients.get('news');

    if (!stockClient || !politicsClient || !newsClient) {
      throw new Error('Bot clients not initialized. Call initialize() first.');
    }

    const stockBot = new StockBot(stockClient);
    const politicsBot = new PoliticsBot(politicsClient);
    const newsBot = new NewsBot(newsClient);

    const politicsTask = cron.schedule(
      '0 8 * * *',
      async () => {
        logger.info('Running politics bot...');
        await politicsBot.generatePost();
      },
      { timezone: 'Asia/Seoul' },
    );

    const newsTask = cron.schedule(
      '1 8 * * *',
      async () => {
        logger.info('Running news bot...');
        await newsBot.generatePost();
      },
      { timezone: 'Asia/Seoul' },
    );

    const stockTask = cron.schedule(
      '2 8 * * 1',
      async () => {
        logger.info('Running stock bot...');
        await stockBot.generatePost();
      },
      { timezone: 'Asia/Seoul' },
    );

    this.tasks.push({
      name: 'politics-bot',
      cronExpression: '0 8 * * *',
      task: politicsTask,
    });

    this.tasks.push({
      name: 'news-bot',
      cronExpression: '1 8 * * *',
      task: newsTask,
    });

    this.tasks.push({
      name: 'stock-bot',
      cronExpression: '2 8 * * 1',
      task: stockTask,
    });

    logger.info(`Scheduler started with ${this.tasks.length} jobs`);
  }

  stop(): void {
    for (const scheduledTask of this.tasks) {
      scheduledTask.task.stop();
    }
    logger.info('Scheduler stopped');
  }

  getTasks(): ScheduledTask[] {
    return [...this.tasks];
  }
}
