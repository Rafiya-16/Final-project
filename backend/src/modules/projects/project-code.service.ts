import prisma from '../../config/database';
import {
  BadRequestError,
  NotFoundError,
} from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

/**
 * Project-code lifecycle.
 *
 * Codes are provisional until explicitly locked during the final project
 * confirmation flow.
 *
 * Nightly reorganization keeps provisional codes ordered by:
 *
 * 1. Faculty assignment time
 * 2. Faculty ID
 * 3. Project creation time
 * 4. Project ID
 *
 * Locked codes are never moved.
 *
 * REJECTED projects:
 * - never participate in numbering
 * - never reserve a number
 * - have their stale projectCode cleared automatically
 */
export class ProjectCodeService {
  /**
   * Only these statuses participate in project-code numbering.
   *
   * REJECTED is intentionally excluded.
   */
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
    /**
     * ---------------------------------------------------------------
     * 1. Verify pool exists
     * ---------------------------------------------------------------
     */
    const poolRows = await prisma.$queryRaw<
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
    `;

    const pool = poolRows[0];

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    /**
     * ---------------------------------------------------------------
     * 2. Clean stale codes from REJECTED projects
     * ---------------------------------------------------------------
     *
     * A rejected project must never hold a projectCode.
     *
     * This also fixes old data created before the rejection behavior
     * was corrected.
     *
     * IMPORTANT:
     * Never clear a locked project here.
     *
     * A normally rejected project should never be locked, but the
     * additional condition protects against accidental data damage.
     */
    await prisma.$executeRaw`
      UPDATE projects
      SET
        "projectCode" = NULL,
        project_code_locked_at = NULL
      WHERE pool_id = ${poolId}
        AND status = 'REJECTED'
        AND project_code_locked = false
    `;

    /**
     * ---------------------------------------------------------------
     * 3. Get active projects belonging to this pool
     * ---------------------------------------------------------------
     *
     * REJECTED projects are deliberately excluded.
     *
     * LEFT JOIN is used so an otherwise valid project does not
     * disappear merely because its pool_faculty record is missing.
     */
    const projects = await prisma.$queryRaw<
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
        AND p.status IN (
          ${this.ACTIVE_STATUSES[0]},
          ${this.ACTIVE_STATUSES[1]},
          ${this.ACTIVE_STATUSES[2]},
          ${this.ACTIVE_STATUSES[3]}
        )
      ORDER BY
        pf.assigned_at ASC NULLS LAST,
        pf.faculty_id ASC NULLS LAST,
        p.created_at ASC,
        p.id ASC
    `;

    /**
     * ---------------------------------------------------------------
     * 4. No active projects
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

    /**
     * ---------------------------------------------------------------
     * 5. Identify locked projects
     * ---------------------------------------------------------------
     *
     * Locked projects retain their current code.
     */
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
     * 7. Get unlocked projects
     * ---------------------------------------------------------------
     *
     * These projects are eligible for nightly reorganization.
     */
    const unlocked = projects.filter(
      (project) => !project.project_code_locked
    );

    /**
     * ---------------------------------------------------------------
     * 8. Generate new provisional codes
     * ---------------------------------------------------------------
     *
     * The projects are already ordered by:
     *
     * 1. Faculty assignment time
     * 2. Faculty ID
     * 3. Project creation time
     * 4. Project ID
     */
    const assignments = new Map<string, string>();

    let nextNumber = 1;

    for (const project of unlocked) {
      /**
       * Skip numbers permanently occupied by locked projects.
       */
      while (occupiedNumbers.has(nextNumber)) {
        nextNumber += 1;
      }

      const projectCode = `${pool.name}/${nextNumber}`;

      assignments.set(project.id, projectCode);

      /**
       * Reserve this number for this provisional project.
       */
      occupiedNumbers.add(nextNumber);

      nextNumber += 1;
    }

    /**
     * ---------------------------------------------------------------
     * 9. Find projects whose code actually changes
     * ---------------------------------------------------------------
     */
    const changedProjects = unlocked.filter((project) => {
      const nextCode = assignments.get(project.id) ?? null;

      return project.projectCode !== nextCode;
    });

    /**
     * Nothing needs to change.
     */
    if (changedProjects.length === 0) {
      return {
        poolId,
        poolName: pool.name,
        updated: 0,
        locked: locked.length,
      };
    }

    /**
     * ---------------------------------------------------------------
     * 10. Update project codes safely
     * ---------------------------------------------------------------
     *
     * projectCode has a UNIQUE constraint.
     *
     * A normal swap can therefore fail:
     *
     *     A -> Pool/1
     *     B -> Pool/2
     *
     * becoming:
     *
     *     A -> Pool/2
     *     B -> Pool/1
     *
     * To prevent this, we use a temporary unique value.
     *
     * Phase 1:
     *   Move every changed provisional project to a temporary code.
     *
     * Phase 2:
     *   Assign the real project codes.
     *
     * Locked projects are never modified.
     */
    await prisma.$transaction(async (tx) => {
      /**
       * -------------------------------------------------------------
       * Phase 1: Move changed provisional codes to temporary values.
       * -------------------------------------------------------------
       *
       * The temporary code contains the project ID, making it unique.
       */
      for (const project of changedProjects) {
        const temporaryCode = `__TEMP_PROJECT_CODE__${project.id}`;

        await tx.$executeRaw`
          UPDATE projects
          SET "projectCode" = ${temporaryCode}
          WHERE id = ${project.id}
            AND project_code_locked = false
        `;
      }

      /**
       * -------------------------------------------------------------
       * Phase 2: Apply the final provisional codes.
       * -------------------------------------------------------------
       */
      for (const project of changedProjects) {
        const projectCode = assignments.get(project.id);

        if (!projectCode) {
          continue;
        }

        await tx.$executeRaw`
          UPDATE projects
          SET "projectCode" = ${projectCode}
          WHERE id = ${project.id}
            AND project_code_locked = false
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