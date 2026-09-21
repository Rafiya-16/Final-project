import cron from 'node-cron';
import { projectCodeService } from '../modules/projects/project-code.service';
import { logger } from '../shared/utils/logger';

// Runs every day at 12:00 AM IST.
 
export const startProjectCodeScheduler = () => {
  cron.schedule(
    '0 0 * * *',
    async () => {
      logger.info(
        'Starting nightly project-code reorganization'
      );

      try {
        await projectCodeService.reorganizeAllPools();

        logger.info(
          'Nightly project-code reorganization completed successfully'
        );
      } catch (error) {
        logger.error(
          'Nightly project-code reorganization failed',
          error instanceof Error
            ? error.stack
            : String(error)
        );
      }
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  logger.info(
    'Nightly project-code scheduler started - runs daily at 12:00 AM IST'
  );
};