import { projectCodeService } from '../modules/projects/project-code.service';
import { logger } from '../shared/utils/logger';

export async function runNightlyProjectCodeJob() {
  const startedAt = Date.now();

  logger.info('Starting nightly project-code reorganization');

  try {
    const results =
      await projectCodeService.reorganizeAllPools();

    const updated = results.reduce(
      (total, result) => total + result.updated,
      0
    );

    const locked = results.reduce(
      (total, result) => total + result.locked,
      0
    );

    logger.info(
      `Nightly project-code reorganization completed: pools=${results.length}, updated=${updated}, locked=${locked}, durationMs=${Date.now() - startedAt}`
    );

    return {
      results,
      updated,
      locked,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    logger.error(
      `Nightly project-code reorganization failed after ${Date.now() - startedAt}ms`,
      error
    );
    throw error;
  }
}
