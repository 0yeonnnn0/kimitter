import app from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
});
