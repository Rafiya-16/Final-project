import prisma from '../../config/database';
import {
  BadRequestError,
  NotFoundError,
} from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

export class ProjectCodeService {
 
  private readonly ACTIVE_STATUSES = [
    'APPROVED',
  ] as const;


  /**
   * Reorganize provisional project codes for one pool.
   */
  async reorganizePool(poolId: string) {
  return prisma.$transaction(async (tx) => {
 
    const poolRows = await tx.$queryRaw<
      Array<{
        id: string;
        name: string;
      }>
    >`
      SELECT
        id,
        name
      FROM pools
      WHERE id = ${poolId}
      LIMIT 1
      FOR UPDATE
    `;

    const pool = poolRows[0];

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    await tx.$executeRaw`
      UPDATE projects
      SET
        "projectCode" = NULL,
        project_code_locked_at = NULL
      WHERE pool_id = ${poolId}
        AND status IN ('REJECTED', 'SUBMITTED', 'ON_HOLD')
        AND project_code_locked = false
    `;

    /**
     * ---------------------------------------------------------------
     * 3. Get APPROVED projects
     * ---------------------------------------------------------------
     */
    const projects = await tx.$queryRaw<
      Array<{
        id: string;
        facultyId: string | null;
        projectCode: string | null;
        project_code_locked: boolean;
        created_at: Date;
        faculty_assigned_at: Date | null;
      }>
    >`
      SELECT
        p.id,
        p.faculty_id AS "facultyId",
        p."projectCode",
        p.project_code_locked,
        p.created_at,
        pf.assigned_at AS "faculty_assigned_at"
      FROM projects p
      LEFT JOIN pool_faculty pf
        ON pf.pool_id = p.pool_id
       AND pf.faculty_id = p.faculty_id
      WHERE p.pool_id = ${poolId}
        AND p.status = ${this.ACTIVE_STATUSES[0]}
      ORDER BY
        pf.assigned_at ASC NULLS LAST,
        pf.faculty_id ASC NULLS LAST,
        p.created_at ASC,
        p.id ASC
    `;

    /**
     * ---------------------------------------------------------------
     * 4. No approved projects
     * ---------------------------------------------------------------
     */
    if (projects.length === 0) {
      return {
        poolId,
        poolName: pool.name,
        updated: 0,
        locked: 0,
      };
    }

    // Locked project codes are permanent and must never be changed.
     
    const locked = projects.filter(
      (project) =>
        project.project_code_locked &&
        this.getCodeNumber(
          project.projectCode,
          pool.name
        ) !== null
    );

    /**
     * ---------------------------------------------------------------
     * 6. Reserve locked project numbers
     * ---------------------------------------------------------------
     */
    const occupiedNumbers = new Set<number>();

    for (const project of locked) {
      const number = this.getCodeNumber(
        project.projectCode,
        pool.name
      );

      if (number !== null) {
        occupiedNumbers.add(number);
      }
    }

    /**
     * ---------------------------------------------------------------
     * 7. Get unlocked approved projects
     * ---------------------------------------------------------------
     */
    const unlocked = projects.filter(
      (project) => !project.project_code_locked
    );

    const assignments = new Map<string, string>();

    let nextNumber = 1;

    for (const project of unlocked) {
      while (occupiedNumbers.has(nextNumber)) {
        nextNumber += 1;
      }

      const projectCode =
        `${pool.name}/${nextNumber}`;

      assignments.set(
        project.id,
        projectCode
      );

      occupiedNumbers.add(nextNumber);

      nextNumber += 1;
    }

    const changedProjects = unlocked.filter(
      (project) => {
        const nextCode =
          assignments.get(project.id) ?? null;

        return project.projectCode !== nextCode;
      }
    );

    if (changedProjects.length === 0) {
      return {
        poolId,
        poolName: pool.name,
        updated: 0,
        locked: locked.length,
      };
    }

    for (const project of unlocked) {
  const temporaryCode =
    `__TEMP_PROJECT_CODE__${project.id}`;

  await tx.$executeRaw`
    UPDATE projects
    SET
      "projectCode" = ${temporaryCode}
    WHERE id = ${project.id}
      AND project_code_locked = false
      AND status = 'APPROVED'
  `;
}

    for (const project of unlocked) {
      const projectCode =
        assignments.get(project.id);

      if (!projectCode) {
        continue;
      }

      await tx.$executeRaw`
        UPDATE projects
        SET
          "projectCode" = ${projectCode},
          project_code_locked_at = NULL
        WHERE id = ${project.id}
          AND project_code_locked = false
          AND status = 'APPROVED'
      `;
    }

    logger.info(
      `Project-code reorganization completed: pool=${poolId}, updated=${changedProjects.length}, locked=${locked.length}`
    );

    return {
      poolId,
      poolName: pool.name,
      updated: changedProjects.length,
      locked: locked.length,
    };
  });
}

  async reorganizeAllPools() {
    const pools = await prisma.$queryRaw<
      Array<{
        id: string;
      }>
    >`
      SELECT
        id
      FROM pools
      WHERE status <> 'ARCHIVED'
      ORDER BY
        created_at ASC,
        id ASC
    `;

    const results = [];

    for (const pool of pools) {
      results.push(
        await this.reorganizePool(pool.id)
      );
    }

    return results;
  }

  /**
   * Permanently lock the current project code during final project
   * confirmation.
   *
   * This is intentionally separate from admin approval.
   */
  async lockProjectCode(projectId: string) {
    /**
     * ---------------------------------------------------------------
     * 1. Find project
     * ---------------------------------------------------------------
     */
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        projectCode: string | null;
        project_code_locked: boolean;
        status: string;
      }>
    >`
      SELECT
        id,
        "projectCode",
        project_code_locked,
        status
      FROM projects
      WHERE id = ${projectId}
      LIMIT 1
    `;

    const project = rows[0];

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    /**
     * ---------------------------------------------------------------
     * 2. Already locked
     * ---------------------------------------------------------------
     */
    if (project.project_code_locked) {
      return project;
    }

    /**
     * ---------------------------------------------------------------
     * 3. Rejected projects cannot be locked
     * ---------------------------------------------------------------
     */
    if (project.status === 'REJECTED') {
      throw new BadRequestError(
        'Rejected projects cannot have a locked project code'
      );
    }

    /**
     * ---------------------------------------------------------------
     * 4. Project must have a provisional code
     * ---------------------------------------------------------------
     */
    if (!project.projectCode) {
      throw new BadRequestError(
        'Project does not have a project code yet'
      );
    }

    /**
     * ---------------------------------------------------------------
     * 5. Lock current code permanently
     * ---------------------------------------------------------------
     */
    const updated = await prisma.$queryRaw<
      Array<{
        id: string;
        projectCode: string | null;
        project_code_locked: boolean;
        project_code_locked_at: Date | null;
      }>
    >`
      UPDATE projects
      SET
        project_code_locked = true,
        project_code_locked_at = NOW()
      WHERE id = ${projectId}
        AND project_code_locked = false
        AND status <> 'REJECTED'
      RETURNING
        id,
        "projectCode",
        project_code_locked,
        project_code_locked_at
    `;

    /**
     * Safety check for concurrent changes.
     */
    if (!updated[0]) {
      throw new BadRequestError(
        'Project code could not be locked'
      );
    }

    logger.info(
      `Project code locked: project=${projectId}, code=${updated[0].projectCode}`
    );

    return updated[0];
  }

  /**
   * Extract the numeric part from a project code.
   *
   * Example:
   *
   *     Pool/17 -> 17
   */
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

    const number = Number(
      projectCode.slice(prefix.length)
    );

    return Number.isInteger(number) && number > 0
      ? number
      : null;
  }
}

export const projectCodeService =
  new ProjectCodeService();