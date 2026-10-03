import { Readable } from 'stream';
import csvParser from 'csv-parser';
import prisma from '../../config/database';
import { UserRole, ImportStatus } from '@prisma/client';
import { hashPassword, generateTempPassword } from '../../shared/utils/hash';
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { csvRowSchema } from './users.validation';
import { IMPORT_LIMITS } from '../../config/constants';
import { paginatedResult, PaginationParams } from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';
import { auditService } from '../audit/audit.service';

interface ParsedRow {
  rowNumber: number;
  rawData: Record<string, string>;
  isValid: boolean;
  errors: string[];
  parsed?: any;
}

export class UsersService {

  private splitName(name: string) {
    const parts = name.trim().split(/\s+/);
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') || '' };
  }

  // ── MANUAL CREATION ──
  async createUser(dto: any, createdById: string) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictError(`Email ${dto.email} already exists`);

    if (dto.enrollmentNo) {
      const dup = await prisma.user.findUnique({ where: { enrollmentNo: dto.enrollmentNo } });
      if (dup) throw new ConflictError(`Enrollment ${dto.enrollmentNo} already exists`);
    }
    if (dto.facultyId) {
      const dup = await prisma.user.findUnique({ where: { facultyId: dto.facultyId }, });
    if (dup) { throw new ConflictError(`Faculty ID ${dto.facultyId} already exists`);
    }
  }
    const identifier = dto.enrollmentNo || dto.email.split('@')[0];
    const tempPassword = generateTempPassword(dto.firstName, identifier);
    const hashedPassword = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department,
        facultyId: dto.role === 'FACULTY' || dto.role === 'SUBADMIN' ? dto.facultyId : null,
        enrollmentNo: dto.role === 'STUDENT' ? dto.enrollmentNo : null,
        semester: dto.role === 'STUDENT' ? dto.semester : null,
        section: dto.role === 'STUDENT' ? dto.section : null,
        designation: dto.role === 'FACULTY' || dto.role === 'SUBADMIN' ? (dto.designation || 'Assistant Professor') : null,
        phone: dto.phone || null,
        mustResetPwd: true,
        createdBy: createdById,
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, enrollmentNo: true, department: true, createdAt: true },
    });

    logger.info(`User created: ${user.email} (${user.role})`);

    // Audit: track user creation
    auditService.log(createdById, 'CREATE_USER', 'User', user.id).catch(() => {});

    return { user, tempPassword };
  }

  // ── CSV PARSING ──
  private async parseCsv(
  buffer: Buffer
): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const rows: ParsedRow[] = [];
    let rowNum = 0;

    const stream = Readable.from(
      buffer.toString('utf8')
    );

    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => {
            const normalized = header
              .trim()
              .replace(/^\uFEFF/, '')
              .replace(/['"]/g, '')
              .toLowerCase()
              .replace(/\s+/g, '');

            const aliases: Record<
              string,
              string
            > = {
              enrollmentno: 'enrollment',
              enrollmentnumber: 'enrollment',
              enrollmentid: 'enrollment',
              'enrollmentno.': 'enrollment',
            };

            return (
              aliases[normalized] ||
              normalized
            );
          },
        })
      )
      .on(
        'data',
        (raw: Record<string, string>) => {
          rowNum++;

          if (
            rowNum >
            IMPORT_LIMITS.MAX_ROWS
          ) {
            stream.destroy();

            reject(
              new BadRequestError(
                `Max ${IMPORT_LIMITS.MAX_ROWS} rows`
              )
            );

            return;
          }

          const hasData = Object.values(
            raw
          ).some(
            value =>
              value &&
              value.trim()
          );

          if (!hasData) {
            return;
          }

          const result =
            csvRowSchema.safeParse(raw);

          if (result.success) {
            const {
              firstName,
              lastName,
            } = this.splitName(
              result.data.name
            );

            const role =
              result.data.role;

            const enrollment =
              role === 'student'
                ? result.data.id
                : '';

            const facultyId =
              role === 'faculty' ||
              role === 'subadmin'
                ? result.data.id
                : '';

            rows.push({
              rowNumber: rowNum,

              rawData: raw,

              isValid: true,

              errors: [],

              parsed: {
                ...result.data,
                firstName,
                lastName,
                enrollment,
                facultyId,
              },
            });
          } else {
            rows.push({
              rowNumber: rowNum,
              rawData: raw,
              isValid: false,
              errors:
                result.error.issues.map(
                  issue =>
                    `${issue.path.join('.')}: ${issue.message}`
                ),
            });
          }
        }
      )
      .on('end', () => {
        resolve(rows);
      })
      .on('error', error => {
        reject(
          new BadRequestError(
            `CSV parse error: ${error.message}`
          )
        );
      });
  });
}

 private validateHeaders(
  buffer: Buffer
) {
  const line =
    buffer
      .toString('utf8')
      .split(/\r?\n/)[0];

  if (
    !line ||
    !line.trim()
  ) {
    throw new BadRequestError(
      'CSV is empty'
    );
  }

  const headers =
    line
      .replace(/^\uFEFF/, '')
      .split(',')
      .map(header =>
        header
          .trim()
          .replace(/['"]/g, '')
          .toLowerCase()
          .replace(/\s+/g, '')
      );

  const normalizedHeaders =
    headers.map(header => {
      if (
        header ===
          'enrollmentno' ||
        header ===
          'enrollmentnumber' ||
        header ===
          'enrollmentid' ||
        header ===
          'enrollmentno.'
      ) {
        return 'enrollment';
      }

      return header;
    });

  const required = [
    'name',
    'email',
    'role',
    'department',
  ];

  const hasId =
    normalizedHeaders.includes(
      'id'
    );

  const hasEnrollment =
    normalizedHeaders.includes(
      'enrollment'
    );

  const missing =
    required.filter(
      header =>
        !normalizedHeaders.includes(
          header
        )
    );

  if (
    !hasId &&
    !hasEnrollment
  ) {
    missing.push(
      'id/enrollment'
    );
  }

  if (missing.length) {
    throw new ValidationError(
      `Missing columns: ${missing.join(
        ', '
      )}. Required: name,email,id,role,department,section`
    );
  }
}

  private findDuplicates(
  rows: ParsedRow[]
): Map<number, string> {
  const duplicates =
    new Map<number, string>();

  const emails =
    new Map<string, number>();

  const enrollments =
    new Map<string, number>();

  const facultyIds =
    new Map<string, number>();

  for (const row of rows) {
    if (
      !row.isValid ||
      !row.parsed
    ) {
      continue;
    }

    const email =
      row.parsed.email;

    const role =
      row.parsed.role;

    if (emails.has(email)) {
      duplicates.set(
        row.rowNumber,
        `Duplicate email at row ${emails.get(
          email
        )}`
      );

      continue;
    }

    emails.set(
      email,
      row.rowNumber
    );

    if (
      role === 'student' &&
      row.parsed.enrollment
    ) {
      const enrollment =
        row.parsed.enrollment;

      if (
        enrollments.has(enrollment)
      ) {
        duplicates.set(
          row.rowNumber,
          `Duplicate enrollment at row ${enrollments.get(
            enrollment
          )}`
        );

        continue;
      }

      enrollments.set(
        enrollment,
        row.rowNumber
      );
    }

    if (
      (
        role === 'faculty' ||
        role === 'subadmin'
      ) &&
      row.parsed.facultyId
    ) {
      const facultyId =
        row.parsed.facultyId;

      if (
        facultyIds.has(facultyId)
      ) {
        duplicates.set(
          row.rowNumber,
          `Duplicate faculty ID at row ${facultyIds.get(
            facultyId
          )}`
        );
        continue;
      }
      facultyIds.set(
        facultyId,
        row.rowNumber
      );
    }
  }
  return duplicates;
}

  // ── BULK IMPORT ──
 async bulkImport(
  file: Express.Multer.File,
  adminId: string
) {
  if (!file) {
    throw new BadRequestError(
      'CSV file required'
    );
  }

  if (
    !file.originalname
      .toLowerCase()
      .endsWith('.csv')
  ) {
    throw new BadRequestError(
      'Only CSV files accepted'
    );
  }

  this.validateHeaders(
    file.buffer
  );

  const parsedRows =
    await this.parseCsv(
      file.buffer
    );

  if (!parsedRows.length) {
    throw new BadRequestError(
      'No data rows found'
    );
  }

  /*
   * -----------------------------------------
   * INTERNAL DUPLICATES
   * -----------------------------------------
   */

  const internalDups =
    this.findDuplicates(
      parsedRows
    );

  for (const [
    rowNumber,
    message,
  ] of internalDups) {
    const row =
      parsedRows.find(
        item =>
          item.rowNumber ===
          rowNumber
      );

    if (row) {
      row.isValid = false;
      row.errors.push(message);
    }
  }

  /*
   * -----------------------------------------
   * VALID ROWS
   * -----------------------------------------
   */

  const validRows =
    parsedRows.filter(
      row =>
        row.isValid &&
        row.parsed
    );

  /*
   * -----------------------------------------
   * COUNTS
   * -----------------------------------------
   */

  const studentCount =
    validRows.filter(
      row =>
        row.parsed.role ===
        'student'
    ).length;

  const facultyCount =
    validRows.filter(
      row =>
        row.parsed.role ===
        'faculty'
    ).length;

  const subadminCount =
    validRows.filter(
      row =>
        row.parsed.role ===
        'subadmin'
    ).length;

  /*
   * -----------------------------------------
   * IMPORT TYPE
   * -----------------------------------------
   */

  const roleTypes =
    [
      studentCount > 0
        ? 'STUDENT'
        : null,

      facultyCount > 0
        ? 'FACULTY'
        : null,

      subadminCount > 0
        ? 'SUBADMIN'
        : null,
    ].filter(Boolean);

  const importType =
    roleTypes.length === 1
      ? roleTypes[0] as string
      : 'MIXED';

  // CREATE IMPORT JOB
  const job =
    await prisma.bulkImportJob.create({
      data: {
        fileName:
          `import_${Date.now()}.csv`,

        originalName:
          file.originalname,

        importType,

        status:
          'PROCESSING',

        totalRows:
          parsedRows.length,

        createdById:
          adminId,

        startedAt:
          new Date(),
      },
    });

  // CHECK EXISTING DB DUPLICATES


  const emails =
    validRows.map(
      row =>
        row.parsed.email
    );

  const enrollments =
    validRows
      .filter(
        row =>
          row.parsed.role ===
            'student' &&
          row.parsed.enrollment
      )
      .map(
        row =>
          row.parsed.enrollment
      );

  const facultyIds =
    validRows
      .filter(
        row =>
          (
            row.parsed.role ===
              'faculty' ||
            row.parsed.role ===
              'subadmin'
          ) &&
          row.parsed.facultyId
      )
      .map(
        row =>
          row.parsed.facultyId
      );

  const [
    existingEmails,
    existingEnrollments,
    existingFacultyIds,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },

      select: {
        email: true,
      },
    }),

    enrollments.length
      ? prisma.user.findMany({
          where: {
            enrollmentNo: {
              in: enrollments,
            },
          },

          select: {
            enrollmentNo: true,
          },
        })
      : Promise.resolve([]),

    facultyIds.length
      ? prisma.user.findMany({
          where: {
            facultyId: {
              in: facultyIds,
            },
          },

          select: {
            facultyId: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const emailSet =
    new Set(
      existingEmails.map(
        user => user.email
      )
    );

  const enrollmentSet =
    new Set(
      existingEnrollments
        .map(
          user =>
            user.enrollmentNo
        )
        .filter(Boolean)
    );

  const facultyIdSet =
    new Set(
      existingFacultyIds
        .map(
          user =>
            user.facultyId
        )
        .filter(Boolean)
    );

  // PREPARE RESULTS


  const results: any[] = [];

  let successCount = 0;
  let failureCount = 0;
  let duplicateCount = 0;

  const toInsert: any[] = [];

 // VALIDATE EACH ROW

  for (const row of parsedRows) {
    if (
      !row.isValid ||
      !row.parsed
    ) {
      failureCount++;

      results.push({
        rowNumber:
          row.rowNumber,

        status:
          'INVALID',

        name:
          row.rawData.name,

        email:
          row.rawData.email,

        error:
          row.errors.join('; '),
      });

      continue;
    }

    const {
      email,
      enrollment,
      facultyId,
      role,
    } = row.parsed;

    /*
     * Email duplicate
     */
    if (
      emailSet.has(email)
    ) {
      duplicateCount++;

      results.push({
        rowNumber:
          row.rowNumber,

        status:
          'DUPLICATE',

        name:
          row.rawData.name,

        email,

        error:
          'Email already exists',
      });

      continue;
    }

    /*
     * Student enrollment duplicate
     */
    if (
      role === 'student' &&
      enrollment &&
      enrollmentSet.has(
        enrollment
      )
    ) {
      duplicateCount++;

      results.push({
        rowNumber:
          row.rowNumber,

        status:
          'DUPLICATE',

        name:
          row.rawData.name,

        email,

        enrollment,

        error:
          'Enrollment already exists',
      });

      continue;
    }

    /*
     * Faculty/SubAdmin ID duplicate
     */
    if (
      (
        role === 'faculty' ||
        role === 'subadmin'
      ) &&
      facultyId &&
      facultyIdSet.has(
        facultyId
      )
    ) {
      duplicateCount++;

      results.push({
        rowNumber:
          row.rowNumber,

        status:
          'DUPLICATE',

        name:
          row.rawData.name,

        email,

        facultyId,

        error:
          'Faculty ID already exists',
      });

      continue;
    }

    /*
     * Password
     */
    const identifier =
      enrollment ||
      facultyId ||
      email.split('@')[0];

    const tempPassword =
      generateTempPassword(
        row.parsed.firstName,
        identifier
      );

    const hashedPassword =
      await hashPassword(
        tempPassword
      );

    toInsert.push({
      rowNumber:
        row.rowNumber,

      parsed:
        row.parsed,

      tempPassword,
      hashedPassword,
    });
    emailSet.add(email);

    if (
      role === 'student' &&
      enrollment
    ) {
      enrollmentSet.add(
        enrollment
      );
    }

    if (
      (
        role === 'faculty' ||
        role === 'subadmin'
      ) &&
      facultyId
    ) {
      facultyIdSet.add(
        facultyId
      );
    }
  }

  // INSERT USERS
  for (
    let i = 0;
    i < toInsert.length;
    i +=
      IMPORT_LIMITS.BATCH_SIZE
  ) {
    const batch =
      toInsert.slice(
        i,
        i +
          IMPORT_LIMITS.BATCH_SIZE
      );

    await prisma.$transaction(
      async tx => {
        for (const item of batch) {
          try {

            let userRole: UserRole;

            switch (
              item.parsed.role
            ) {
              case 'student':
                userRole =
                  'STUDENT';
                break;

              case 'faculty':
                userRole =
                  'FACULTY';
                break;

              case 'subadmin':
                userRole =
                  'SUBADMIN';
                break;

              default:
                throw new Error(
                  `Unsupported role: ${item.parsed.role}`
                );
            }

            const isStudent =
              userRole ===
              'STUDENT';

            const isFaculty =
              userRole ===
              'FACULTY';

            const isSubadmin =
              userRole ===
              'SUBADMIN';

            const created =
              await tx.user.create({
                data: {
                  email:
                    item.parsed.email,

                  password:
                    item.hashedPassword,

                  role:
                    userRole,

                  firstName:
                    item.parsed.firstName,

                  lastName:
                    item.parsed.lastName,

                  department:
                    item.parsed.department,

                  enrollmentNo:
                    isStudent
                      ? item.parsed
                          .enrollment
                      : null,

                  facultyId:
                    isFaculty ||
                    isSubadmin
                      ? item.parsed
                          .facultyId
                      : null,

                  section:
                    isStudent
                      ? (
                          item.parsed
                            .section ||
                          null
                        )
                      : null,

                  designation:
                    isFaculty ||
                    isSubadmin
                      ? 'Assistant Professor'
                      : null,

                  mustResetPwd:
                    true,

                  createdBy:
                    adminId,
                },

                select: {
                  id: true,
                  email: true,
                  role: true,
                  firstName: true,
                  lastName: true,
                  enrollmentNo: true,
                  facultyId: true,
                  department: true,
                  section: true,
                  createdAt: true,
                },
              });

            await tx.importRow.create({
              data: {
                jobId:
                  job.id,

                rowNumber:
                  item.rowNumber,

                rawData:
                  item.parsed,

                status:
                  'SUCCESS',

                userId:
                  created.id,
              },
            });

            successCount++;

            results.push({
              rowNumber:
                item.rowNumber,

              status:
                'SUCCESS',

              name:
                `${item.parsed.firstName} ${item.parsed.lastName}`,

              email:
                item.parsed.email,

              role:
                item.parsed.role,

              enrollment:
                item.parsed.enrollment ||
                null,

              facultyId:
                item.parsed.facultyId ||
                null,

              section:
                item.parsed.section ||
                null,

              tempPassword:
                item.tempPassword,
            });
          } catch (err: any) {
            failureCount++;

            await tx.importRow.create({
              data: {
                jobId:
                  job.id,

                rowNumber:
                  item.rowNumber,

                rawData:
                  item.parsed,

                status:
                  'FAILED',

                errorMsg:
                  err.message,
              },
            });

            results.push({
              rowNumber:
                item.rowNumber,

              status:
                'FAILED',

              email:
                item.parsed.email,

              error:
                err.message,
            });
          }
        }
      }
    );
  }

// SAVE INVALID / DUPLICATE ROWS


  for (const row of parsedRows) {
    const result =
      results.find(
        item =>
          item.rowNumber ===
          row.rowNumber
      );

    if (
      !result ||
      (
        result.status !==
          'INVALID' &&
        result.status !==
          'DUPLICATE'
      )
    ) {
      continue;
    }

    const exists =
      await prisma.importRow.findFirst({
        where: {
          jobId:
            job.id,

          rowNumber:
            row.rowNumber,
        },
      });

    if (!exists) {
      await prisma.importRow.create({
        data: {
          jobId:
            job.id,

          rowNumber:
            row.rowNumber,

          rawData:
            row.rawData,

          status:
            result.status ===
            'DUPLICATE'
              ? 'DUPLICATE'
              : 'FAILED',

          errorMsg:
            result.error,
        },
      });
    }
  }

  // FINAL STATUS


  const finalStatus: ImportStatus =
    successCount ===
    parsedRows.length
      ? 'COMPLETED'
      : successCount === 0
        ? 'FAILED'
        : 'PARTIAL';

  await prisma.bulkImportJob.update({
    where: {
      id: job.id,
    },

    data: {
      status:
        finalStatus,
      successCount,
      failureCount,
      duplicateCount,
      completedAt:
        new Date(),

      errorSummary: {
        total: parsedRows.length,
        students: studentCount,
        faculty: facultyCount,
        subadmins: subadminCount,
        succeeded: successCount,
        failed: failureCount,
        duplicates: duplicateCount,
      },
    },
  });

  results.sort(
    (a, b) =>
      a.rowNumber -
      b.rowNumber
  );

  logger.info(
    `Import done: ${successCount}/${parsedRows.length} success`,
    {
      jobId: job.id,
    }
  );

  return {
    jobId: job.id,
    status: finalStatus,
    totalRows: parsedRows.length, successCount, failureCount, duplicateCount, results,
  };
}

  async getImportJob(jobId: string) {
    const job = await prisma.bulkImportJob.findUnique({ where: { id: jobId }, include: { rows: { orderBy: { rowNumber: 'asc' } }, creator: { select: { firstName: true, lastName: true, email: true } } } });
    if (!job) throw new NotFoundError('Job not found');
    return job;
  }

  async getImportHistory(params: PaginationParams) {
    const [jobs, total] = await Promise.all([
      prisma.bulkImportJob.findMany({ skip: (params.page - 1) * params.limit, take: params.limit, orderBy: { createdAt: 'desc' }, include: { creator: { select: { firstName: true, lastName: true } } } }),
      prisma.bulkImportJob.count(),
    ]);
    return paginatedResult(jobs, total, params);
  }

  async listUsers(filters: any, params: PaginationParams) {
    const where: any = {};
    if (filters.role) where.role = filters.role;
    if (filters.department) where.department = { equals: filters.department, mode: 'insensitive' };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { enrollmentNo: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip: (params.page - 1) * params.limit, take: params.limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
        select: { id: true, email: true, role: true, firstName: true, lastName: true, enrollmentNo: true, facultyId: true, department: true, semester: true, section: true, designation: true, phone: true, isActive: true, mustResetPwd: true, lastLoginAt: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return paginatedResult(users, total, params);
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, enrollmentNo: true, department: true, semester: true, section: true, designation: true, phone: true, isActive: true, mustResetPwd: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateUser(id: string, dto: any) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return prisma.user.update({ where: { id }, data: dto, select: { id: true, email: true, role: true, firstName: true, lastName: true, department: true, isActive: true, updatedAt: true } });
  }

  async toggleStatus(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    if (user.role === 'ADMIN') throw new BadRequestError('Cannot deactivate admin');
    return prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: { id: true, email: true, firstName: true, lastName: true, isActive: true } });
  }

  async resetPassword(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    const identifier = user.enrollmentNo || user.email.split('@')[0];
    const tempPassword = generateTempPassword(user.firstName, identifier);
    const hashed = await hashPassword(tempPassword);
    await prisma.user.update({ where: { id }, data: { password: hashed, mustResetPwd: true } });
    await prisma.refreshToken.updateMany({ where: { userId: id }, data: { isRevoked: true } });
    return { tempPassword };
  }

  async getStats() {
    const [total, students, faculty, subadmins, active, inactive] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'FACULTY' } }),
      prisma.user.count({ where: { role: 'SUBADMIN' } }),
      prisma.user.count({ where: { isActive: true, role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);
    const departments = await prisma.user.groupBy({ by: ['department'], _count: { id: true }, where: { department: { not: null } }, orderBy: { _count: { id: 'desc' } } });
    return { total, students, faculty, subadmins, active, inactive, departments: departments.map(d => ({ name: d.department, count: d._count.id })) };
  }
}

export const usersService = new UsersService();