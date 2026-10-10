import prisma from '../../config/database';
import { NotFoundError } from '../../shared/errors/AppError';

export class ReportsService {

  async getTeamReport(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const teams = await prisma.team.findMany({
      where: {
        poolId,
        status: { not: 'DISSOLVED' },
      },

      include: {
        project: {
          include: {
            faculty: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },

        members: {
          where: {
            status: 'ACTIVE',
          },

          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                enrollmentNo: true,
              },
            },
          },

          orderBy: {
            role: 'asc',
          },
        },

        leader: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });

    return {
      pool: {
        id: pool.id,
        name: pool.name,
        academicYear: pool.academicYear,
        semester: pool.semester,
      },
      teams,
      generatedAt: new Date(),
    };
  }

  async getAllocationSummary(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

   const [
  totalStudents,
  totalFaculty,
  totalProjects,
  approvedProjects,
  totalTeams,
  frozenTeams,
  unassignedStudents,
  assignedStudents,
] = await Promise.all([
  // Total students registered in this pool
  prisma.poolStudent.count({
    where: { poolId },
  }),

  // Total faculty assigned to this pool
  prisma.poolFaculty.count({
    where: { poolId },
  }),

  // All projects in this pool
  prisma.project.count({
    where: { poolId },
  }),

  // Approved projects
  prisma.project.count({
    where: {
      poolId,
      status: 'APPROVED',
    },
  }),

  // Non-dissolved teams
  prisma.team.count({
    where: {
      poolId,
      status: { not: 'DISSOLVED' },
    },
  }),

  // Frozen teams
  prisma.team.count({
    where: {
      poolId,
      status: 'FROZEN',
    },
  }),

  // Students without an active team membership
  prisma.poolStudent.count({
    where: {
      poolId,
      student: {
        teamMemberships: {
          none: {
            team: { poolId },
            status: 'ACTIVE',
          },
        },
      },
    },
  }),

  // Students with an active membership in a non-dissolved team
  prisma.teamMember.count({
    where: {
      status: 'ACTIVE',
      team: {
        poolId,
        status: { not: 'DISSOLVED' },
      },
    },
  }),
]);

    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        poolId,
      },
    });

    return {
      pool: {
        id: pool.id,
        name: pool.name,
        status: pool.status,
      },

      totalStudents,
      totalFaculty,
      totalProjects,
      approvedProjects,
      assignedStudents,
      totalTeams,
      frozenTeams,
      unassignedStudents,

      projectsByStatus: projectsByStatus.map((project) => ({
        status: project.status,
        count: project._count.id,
      })),

      generatedAt: new Date(),
    };
  }

  async getUnassignedStudents(poolId: string) {
    const students = await prisma.poolStudent.findMany({
      where: {
        poolId,

        student: {
          teamMemberships: {
            none: {
              team: {
                poolId,
              },
              status: 'ACTIVE',
            },
          },
        },
      },

      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            enrollmentNo: true,
            section: true,
          },
        },
      },
    });

    return students.map((student) => student.student);
  }

  async getFacultyReport(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: {
        id: poolId,
      },

      select: {
        id: true,
        name: true,
        academicYear: true,
        semester: true,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const poolFaculty = await prisma.poolFaculty.findMany({
      where: {
        poolId,
      },

      include: {
        faculty: {
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            designation: true,
            phone: true,
            isActive: true,

            facultyProjects: {
              where: {
                poolId,
              },

              orderBy: {
                createdAt: 'desc',
              },

              select: {
                id: true,
                title: true,
                description: true,
                domain: true,
                prerequisites: true,
                expectedOutcome: true,
                maxTeamSize: true,
                projectCode: true,
                status: true,
                subadminNote: true,
                adminNote: true,
                reviewedAt: true,
                decidedAt: true,
                createdAt: true,
                updatedAt: true,
                team: {
                 select: {
                   name: true,
                  },  
                },
              },
            },
          },
        },
      },
    });

    poolFaculty.sort((a, b) => {
      const nameA = `${a.faculty.firstName} ${a.faculty.lastName}`.toLowerCase();
      const nameB = `${b.faculty.firstName} ${b.faculty.lastName}`.toLowerCase();

      return nameA.localeCompare(nameB);
    });

    const faculty = poolFaculty.map((assignment) => {
      const facultyMember = assignment.faculty;

      return {
        faculty: {
          id: facultyMember.id,
          facultyId: facultyMember.facultyId,
          firstName: facultyMember.firstName,
          lastName: facultyMember.lastName,
          email: facultyMember.email,
          department: facultyMember.department,
          designation: facultyMember.designation,
          phone: facultyMember.phone,
          isActive: facultyMember.isActive,
        },

        hasSubmitted: assignment.hasSubmitted,
        submittedAt: assignment.submittedAt,
        proposalCount: facultyMember.facultyProjects.length,
        totalTopics: facultyMember.facultyProjects.length,
        approvedProjects: facultyMember.facultyProjects.filter((project) => project.status === 'APPROVED').length,
        proposals: facultyMember.facultyProjects,
      };
    });

    return {
      pool: {
        id: pool.id,
        name: pool.name,
        academicYear: pool.academicYear,
        semester: pool.semester,
      },

      totalFaculty: faculty.length,

      totalProposals: faculty.reduce(
        (total, facultyMember) =>
          total + facultyMember.proposalCount,
        0
      ),

      faculty,

      generatedAt: new Date(),
    };
  }
}

export const reportsService = new ReportsService();