import app from './app';
import { config } from './config';
import { logger } from './shared/utils/logger';
import { startPoolPhaseSyncJob } from './jobs/pool-phase-sync.job';

const startServer = async () => {
  try {
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      startPoolPhaseSyncJob();
      logger.info('Pool phase synchronization job started');
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();