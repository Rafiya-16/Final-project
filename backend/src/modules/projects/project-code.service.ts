import prisma from '../../config/database';
import { BadRequestError, NotFoundError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

/**
 * Project-code lifecycle
 *
 * Codes are provisional until explicitly locked during the final project
 * confirmation flow. The nightly job keeps provisional codes contiguous and
 * ordered by faculty assignment, then project creation time.
 *
 * Locked codes are never moved. When a locked number exists, that number is
 * reserved and the remaining projects receive the lowest available numbers.
 */
export class ProjectCodeService {
  private readonly ACTIVE_STATUSES = [
    'SUBMITTED',
    'LOCKED',
    'ON_HOLD',
    'APPROVED',
  ] as const;

  /**
   * Reorganize provisional project codes for one pool.
   */
  async reorganizePool(poolId: string) {
    const poolRows = await prisma.$queryRaw<
      Array<{ id: string; name: string }>
    >`
      SELECT id, name
      FROM pools
      WHERE id = ${poolId}
      LIMIT 1
    `;

    const pool = poolRows[0];

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const projects = await prisma.$queryRaw<
      Array<{
        id: string;
        faculty_id: string;
        project_code: string | null;
        project_code_locked: boolean;
        assigned_at: Date;
        created_at: Date;
      }>
    >`
      SELECT
        p.id,
        p.faculty_id,
        p.project_code,
        p.project_code_locked,
        pf.assigned_at,
        p.created_at
      FROM projects p
      INNER JOIN pool_faculty pf
        ON pf.pool_id = p.pool_id
       AND pf.faculty_id = p.faculty_id
      WHERE p.pool_id = ${poolId}
        AND p.status IN (${this.ACTIVE_STATUSES[0]}, ${this.ACTIVE_STATUSES[1]}, ${this.ACTIVE_STATUSES[2]}, ${this.ACTIVE_STATUSES[3]})
      ORDER BY pf.assigned_at ASC, pf.faculty_id ASC, p.created_at ASC, p.id ASC
    `;

    if (projects.length === 0) {
      return {
        poolId,
        poolName: pool.name,
        updated: 0,
        locked: 0,
      };
    }

    const locked = projects.filter(
      (project) =>
        project.project_code_locked &&
        this.getCodeNumber(project.project_code, pool.name) !== null
    );

    const occupiedNumbers = new Set<number>();

    for (const project of locked) {
      const number = this.getCodeNumber(project.project_code, pool.name);

      if (number !== null) {
        occupiedNumbers.add(number);
      }
    }

    const unlocked = projects.filter(
      (project) => !project.project_code_locked
    );

    const assignments = new Map<string, string>();
    let nextNumber = 1;

    for (const project of unlocked) {
      while (occupiedNumbers.has(nextNumber)) {
        nextNumber += 1;
      }

      assignments.set(
        project.id,
        `${pool.name}/${nextNumber}`
      );

      occupiedNumbers.add(nextNumber);
      nextNumber += 1;
    }

    const changedProjects = unlocked.filter((project) => {
      const nextCode = assignments.get(project.id) ?? null;
      return project.project_code !== nextCode;
    });

    if (changedProjects.length === 0) {
      return {
        poolId,
        poolName: pool.name,
        updated: 0,
        locked: locked.length,
      };
    }

    await prisma.$transaction(async (tx) => {
      // projectCode is globally unique in the current schema. Clear all
      // provisional codes first so projects can safely swap numbers in one
      // transaction without temporary unique-constraint collisions.
      await tx.$executeRaw`
        UPDATE projects
        SET project_code = NULL
        WHERE id IN (${this.sqlIds(changedProjects.map((project) => project.id))})
      `;

      for (const project of changedProjects) {
        const projectCode = assignments.get(project.id);

        if (!projectCode) {
          continue;
        }

        await tx.$executeRaw`
          UPDATE projects
          SET project_code = ${projectCode}
          WHERE id = ${project.id}
        `;
      }
    });

    logger.info(
      `Nightly project-code reorganization: pool=${poolId}, updated=${changedProjects.length}, locked=${locked.length}`
    );

    return {
      poolId,
      poolName: pool.name,
      updated: changedProjects.length,
      locked: locked.length,
    };
  }

  /**
   * Reorganize every non-archived pool.
   */
  async reorganizeAllPools() {
    const pools = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      SELECT id
      FROM pools
      WHERE status <> 'ARCHIVED'
      ORDER BY created_at ASC, id ASC
    `;

    const results = [];

    for (const pool of pools) {
      results.push(await this.reorganizePool(pool.id));
    }

    return results;
  }

  /**
   * Permanently lock the current code during final project confirmation.
   *
   * This method is intentionally separate from admin approval. It should be
   * called by the final-confirmation flow once that flow is reached.
   */
  async lockProjectCode(projectId: string) {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        project_code: string | null;
        project_code_locked: boolean;
      }>
    >`
      SELECT id, project_code, project_code_locked
      FROM projects
      WHERE id = ${projectId}
      LIMIT 1
    `;

    const project = rows[0];

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.project_code_locked) {
      return project;
    }

    if (!project.project_code) {
      throw new BadRequestError(
        'Project does not have a project code yet'
      );
    }

    const updated = await prisma.$queryRaw<
      Array<{
        id: string;
        project_code: string | null;
        project_code_locked: boolean;
        project_code_locked_at: Date | null;
      }>
    >`
      UPDATE projects
      SET
        project_code_locked = true,
        project_code_locked_at = NOW()
      WHERE id = ${projectId}
      RETURNING
        id,
        project_code,
        project_code_locked,
        project_code_locked_at
    `;

    return updated[0];
  }

  private getCodeNumber(
    projectCode: string | null,
    poolName: string
  ): number | null {
    if (!projectCode) {
      return null;
    }

    const prefix = `${poolName}/`;

    if (!projectCode.startsWith(prefix)) {
      return null;
    }

    const number = Number(projectCode.slice(prefix.length));

    return Number.isInteger(number) && number > 0 ? number : null;
  }

  /**
   * Prisma's SQL-tag API does not accept an array as an IN-list by itself.
   * Build a parameterized placeholder list using Prisma.sql.
   */
  private sqlIds(ids: string[]) {
    return ids.length === 1
      ? prisma.$queryRaw`${ids[0]}`
      : ids.join(',');
  }
}

export const projectCodeService = new ProjectCodeService();
