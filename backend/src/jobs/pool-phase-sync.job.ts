import prisma from '../config/database';
import { PoolsService } from '../modules/pools/pools.service';
import { logger } from '../shared/utils/logger';

const poolsService = new PoolsService();

export const syncPoolPhases = async (): Promise<void> => {
  try {
    const pools = await prisma.pool.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      select: {
        id: true,
      },
    });

    for (const pool of pools) {
      try {
        await poolsService.syncPoolPhase(pool.id);
      } catch (error) {
        logger.error(`Failed to sync phase for pool ${pool.id}`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to fetch pools for phase synchronization', error);
  }
};

export const startPoolPhaseSyncJob = (): NodeJS.Timeout => {
  void syncPoolPhases();

  return setInterval(() => {
    void syncPoolPhases();
  }, 60 * 1000);
};