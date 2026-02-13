import { config } from './config/environment';
import { createWebhookServer } from './webhook/webhookServer';
import { BotScheduler } from './scheduler';
import { logger } from './utils/logger';

export async function main(): Promise<void> {
  logger.info('Starting Kimitter Bot Service...');

  const scheduler = new BotScheduler();
  await scheduler.initialize();

  const app = createWebhookServer();
  const server = app.listen(config.bot.webhookPort, () => {
    logger.info(`Bot service started on port ${config.bot.webhookPort}`);
  });

  scheduler.start();

  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    scheduler.stop();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});
