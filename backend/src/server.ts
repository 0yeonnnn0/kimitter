import app from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { startCleanupSchedule } from './services/notificationService';

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
  startCleanupSchedule();
});
