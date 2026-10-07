import prisma from '../../config/database';
import { logger } from '../../shared/utils/logger';

export const PROJECTS_PER_FACULTY = 4;

type PrismaClientLike = typeof prisma;

function getAcademicYearShort(
  academicYear: string,
): string {
  const match =
    academicYear.match(/\b(20\d{2})\b/);

  if (!match) {
    throw new Error(
      `Invalid academic year format: ${academicYear}`,
    );
  }

  return match[1].slice(-2);
}

function getStartNumber(
  allocationOrder: number,
): number {
  if (
    !Number.isInteger(
      allocationOrder,
    ) ||
    allocationOrder < 1
  ) {
    throw new Error(
      `Invalid faculty allocation order: ${allocationOrder}`,
    );
  }

  return (
    (allocationOrder - 1) *
      PROJECTS_PER_FACULTY +
    1
  );
}

function getFacultyCodes(
  academicYear: string,
  allocationOrder: number,
): string[] {
  const year =
    getAcademicYearShort(
      academicYear,
    );

  const prefix = `PCS${year}`;

  const start =
    getStartNumber(
      allocationOrder,
    );

  return Array.from(
    {
      length:
        PROJECTS_PER_FACULTY,
    },
    (_, index) =>
      `${prefix}-${start + index}`,
  );
}

function getFacultySortName(
  firstName: string | null,
  lastName: string | null,
): string {
  return `${firstName ?? ''} ${
    lastName ?? ''
  }`
    .trim()
    .toLocaleLowerCase();
}

export class ProjectCodeService {

  async initializeFacultyAllocation(
    poolId: string,
    client: PrismaClientLike = prisma,
  ) {
    const pool =
      await client.pool.findUnique({
        where: {
          id: poolId,
        },
        select: {
          id: true,
        },
      });

    if (!pool) {
      throw new Error(
        'Pool not found',
      );
    }

    const assignments =
      await client.poolFaculty.findMany({
        where: {
          poolId,
        },

        include: {
          faculty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },

        orderBy: {
          assignedAt: 'asc',
        },
      });

    const existingOrders =
      assignments
        .map(
          (assignment) =>
            assignment.allocationOrder,
        )
        .filter(
          (
            order,
          ): order is number =>
            order !== null,
        );

    let nextAllocationOrder =
      existingOrders.length > 0
        ? Math.max(
            ...existingOrders,
          ) + 1
        : 1;

    const unassigned =
      assignments
        .filter(
          (assignment) =>
            assignment.allocationOrder ===
            null,
        )
        .sort(
          (a, b) => {
            const nameA =
              getFacultySortName(
                a.faculty.firstName,
                a.faculty.lastName,
              );

            const nameB =
              getFacultySortName(
                b.faculty.firstName,
                b.faculty.lastName,
              );

            const nameComparison =
              nameA.localeCompare(
                nameB,
              );

            if (
              nameComparison !==
              0
            ) {
              return nameComparison;
            }

            return a.faculty.id.localeCompare(
              b.faculty.id,
            );
          },
        );

    for (const assignment of unassigned) {
      await client.poolFaculty.update({
        where: {
          id: assignment.id,
        },

        data: {
          allocationOrder:
            nextAllocationOrder,
        },
      });

      nextAllocationOrder++;
    }

    return client.poolFaculty.findMany({
      where: {
        poolId,
      },

      include: {
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        allocationOrder: 'asc',
      },
    });
  }

  async getFacultyProjectCodes(
    poolId: string,
    facultyId: string,
    client: PrismaClientLike = prisma,
  ) {
    const assignment =
      await client.poolFaculty.findUnique({
        where: {
          poolId_facultyId: {
            poolId,
            facultyId,
          },
        },

        select: {
          allocationOrder: true,
        },
      });

    if (!assignment) {
      throw new Error(
        'Faculty is not assigned to this pool',
      );
    }

    if (
      assignment.allocationOrder ===
      null
    ) {
      throw new Error(
        'Faculty does not have a project-code allocation order',
      );
    }

    const pool =
      await client.pool.findUnique({
        where: {
          id: poolId,
        },

        select: {
          academicYear: true,
        },
      });

    if (!pool) {
      throw new Error(
        'Pool not found',
      );
    }

    return getFacultyCodes(
      pool.academicYear,
      assignment.allocationOrder,
    );
  }

  async assignNextProjectCode(
    projectId: string,
    client: PrismaClientLike = prisma,
  ) {
    const project =
      await client.project.findUnique({
        where: {
          id: projectId,
        },

        select: {
          id: true,
          poolId: true,
          facultyId: true,
          status: true,
          projectCode: true,
          title: true,
        },
      });

    if (!project) {
      throw new Error(
        'Project not found',
      );
    }

    /**
     * Never assign a code before approval.
     */
    if (
      project.status !==
      'APPROVED'
    ) {
      throw new Error(
        'Project code can only be assigned to an APPROVED project',
      );
    }

    if (project.projectCode) {
      return project;
    }

    if (!project.facultyId) {
      throw new Error(
        'Project cannot receive a project code until a faculty supervisor is assigned',
      );
    }

    const pool =
      await client.pool.findUnique({
        where: {
          id: project.poolId,
        },

        select: {
          academicYear: true,
        },
      });

    if (!pool) {
      throw new Error(
        'Pool not found',
      );
    }

    const facultyAssignment =
      await client.poolFaculty.findUnique({
        where: {
          poolId_facultyId: {
            poolId:
              project.poolId,
            facultyId:
              project.facultyId,
          },
        },

        select: {
          allocationOrder: true,
        },
      });

    if (!facultyAssignment) {
      throw new Error(
        'Project faculty is not assigned to this pool',
      );
    }

    if (
      facultyAssignment.allocationOrder ===
      null
    ) {
      throw new Error(
        'Project faculty does not have a project-code allocation order',
      );
    }

    const facultyCodes =
      getFacultyCodes(
        pool.academicYear,
        facultyAssignment.allocationOrder,
      );

    const existingProjects =
      await client.project.findMany({
        where: {
          poolId:
            project.poolId,

          projectCode: {
            in: facultyCodes,
          },
        },

        select: {
          projectCode: true,
        },
      });

    const usedCodes =
      new Set(
        existingProjects
          .map(
            (item) =>
              item.projectCode,
          )
          .filter(
            (
              code,
            ): code is string =>
              code !== null,
          ),
      );

    const nextCode =
      facultyCodes.find(
        (code) =>
          !usedCodes.has(code),
      );

    if (!nextCode) {
      throw new Error(
        `This faculty has already reached the maximum of ${PROJECTS_PER_FACULTY} approved projects for this pool`,
      );
    }

    const updated =
      await client.project.update({
        where: {
          id: projectId,
        },

        data: {
          projectCode:
            nextCode,
        },

        select: {
          id: true,
          poolId: true,
          facultyId: true,
          title: true,
          status: true,
          projectCode: true,
        },
      });

    logger.info(
      `Assigned project code ${nextCode} to project ${projectId}`,
    );

    return updated;
  }

  async getPoolFacultyAllocations(
    poolId: string,
    client: PrismaClientLike = prisma,
  ) {
    const pool =
      await client.pool.findUnique({
        where: {
          id: poolId,
        },

        select: {
          academicYear: true,
        },
      });

    if (!pool) {
      throw new Error(
        'Pool not found',
      );
    }

    const assignments =
      await client.poolFaculty.findMany({
        where: {
          poolId,
        },

        include: {
          faculty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },

        orderBy: [
          {
            allocationOrder:
              'asc',
          },
          {
            assignedAt:
              'asc',
          },
        ],
      });

    return assignments.map(
      (assignment) => ({
        poolId,

        facultyId:
          assignment.facultyId,

        faculty:
          assignment.faculty,

        allocationOrder:
          assignment.allocationOrder,

        projectCodes:
          assignment.allocationOrder !==
          null
            ? getFacultyCodes(
                pool.academicYear,
                assignment.allocationOrder,
              )
            : [],
      }),
    );
  }
}

export const projectCodeService =
  new ProjectCodeService();