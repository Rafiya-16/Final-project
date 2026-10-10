import React, { useState, useEffect, useRef, useMemo } from 'react'; 
import { poolService } from '@/services/poolService'; 
import { reportService } from '@/services/reportService'; 
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'; 
import { EmptyState } from '@/components/ui/EmptyState'; 
import { Badge } from '@/lib/utils'; 
import { Printer, UserCheck, Download, BarChart3, Users, UserX } from 'lucide-react'; 
import { toast } from 'react-hot-toast'; 
import type { Pool } from '@/types'; 
import { useAuthStore } from '@/stores/authStore'; 
import { useWorkplaceStore } from '@/stores/workplaceStore'; 
import * as XLSX from 'xlsx';

type Tab = 'summary' | 'teams' | 'faculty' | 'unassigned';

type ReportRecord = Record<string, any>;

type SectionGroup = {
  displayName: string;
  students: ReportRecord[];
};

const normalizeSortValue = (value: unknown): string => {
  return String(value ?? '').trim().toLowerCase();
};

const displayValue = (
  value: unknown,
  fallback = '—'
): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return String(value);
};

const formatDate = (value: unknown): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-GB');
};

const getArrayFromResponse = (
  response: any
): ReportRecord[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

const getObjectFromResponse = (
  response: any
): ReportRecord => {
  if (
    response?.data &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  if (
    response &&
    typeof response === 'object' &&
    !Array.isArray(response)
  ) {
    return response;
  }

  return {};
};

const getProjectFromTeam = (
  team: ReportRecord
): ReportRecord => {
  return (
    team?.project ||
    team?.Project ||
    {}
  );
};

const getFacultyFromProject = (
  project: ReportRecord
): ReportRecord => {
  return (
    project?.faculty ||
    project?.Faculty ||
    project?.supervisor ||
    project?.Supervisor ||
    {}
  );
};

const getProjectStudents = (
  team: ReportRecord
): ReportRecord[] => {
  const members =
    team?.members ||
    team?.students ||
    team?.teamMembers ||
    team?.TeamMembers ||
    [];

  return Array.isArray(members) ? members : [];
};

const getStudentFromMember = (
  member: ReportRecord
): ReportRecord => {
  return (
    member?.student ||
    member?.user ||
    member?.Student ||
    member?.member ||
    member
  );
};

const ReportsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState('');

  const [tab, setTab] = useState<Tab>('summary');

  const [summary, setSummary] =
    useState<ReportRecord | null>(null);

  const [teamReport, setTeamReport] =
    useState<ReportRecord | null>(null);

  const [facultyReport, setFacultyReport] =
    useState<ReportRecord | null>(null);

  const [unassigned, setUnassigned] =
    useState<ReportRecord[]>([]);

  const [expandedFaculty, setExpandedFaculty] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] =
    useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const { activeWorkplace } = useWorkplaceStore();

  useEffect(() => {
    let mounted = true;

    const loadPools = async () => {
      try {
        setLoading(true);

        const scope =
          user?.role === 'ADMIN'
            ? 'all'
            : user?.role === 'SUBADMIN'
              ? 'subadmin'
              : activeWorkplace === 'SUBADMIN'
                ? 'subadmin'
                : 'faculty';

        const response = await poolService.list(
          1,
          scope
        );

        if (!mounted) {
          return;
        }

        const poolList = getArrayFromResponse(
          response
        ) as Pool[];

        setPools(poolList);

        if (poolList.length > 0) {
          setSelectedPool(
            (current) => current || poolList[0].id
          );
        } else {
          setSelectedPool('');
        }
      } catch (error) {
        console.error(
          'Failed to load pools:',
          error
        );

        toast.error('Failed to load pools');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPools();

    return () => {
      mounted = false;
    };
  }, [user?.role, activeWorkplace]);

  useEffect(() => {
    if (!selectedPool) {
      setSummary(null);
      setTeamReport(null);
      setFacultyReport(null);
      setUnassigned([]);
      return;
    }

    let mounted = true;

    const loadReports = async () => {
      try {
        setLoadingReports(true);

        const [
          summaryResponse,
          teamResponse,
          facultyResponse,
          unassignedResponse,
        ] = await Promise.all([
          reportService.summary(selectedPool),
          reportService.teamReport(selectedPool),
          reportService.facultyReport(
            selectedPool
          ),
          reportService.unassigned(
            selectedPool
          ),
        ]);

        if (!mounted) {
          return;
        }

        setSummary(
          getObjectFromResponse(summaryResponse)
        );

        setTeamReport(
          getObjectFromResponse(teamResponse)
        );

        setFacultyReport(
          getObjectFromResponse(facultyResponse)
        );
        setUnassigned(
          getArrayFromResponse(
            unassignedResponse
          )
        );
      } catch (error) {
        console.error(
          'Failed to load reports:',
          error
        );

        toast.error('Failed to load reports');

        if (mounted) {
          setSummary(null);
          setTeamReport(null);
          setFacultyReport(null);
          setUnassigned([]);
        }
      } finally {
        if (mounted) {
          setLoadingReports(false);
        }
      }
    };

    loadReports();

    return () => {
      mounted = false;
    };
  }, [selectedPool]);

  const poolName = useMemo(() => {
    const pool = pools.find(
      (item) => item.id === selectedPool
    );

    return (
      pool?.name ||
      teamReport?.pool?.name ||
      summary?.pool?.name ||
      'Pool'
    );
  }, [
    pools,
    selectedPool,
    teamReport,
    summary,
  ]);

  const teams = useMemo<ReportRecord[]>(() => {
    const data =
      teamReport?.teams ||
      teamReport?.teamReport ||
      teamReport?.data ||
      [];

    return Array.isArray(data) ? data : [];
  }, [teamReport]);

  const faculty = useMemo<ReportRecord[]>(() => {
    const data =
      facultyReport?.faculty ||
      facultyReport?.facultyReport ||
      facultyReport?.data ||
      [];

    return Array.isArray(data) ? data : [];
  }, [facultyReport]);

  const projects = useMemo<ReportRecord[]>(() => {
    const sources = [
      teamReport?.projects,
      teamReport?.projectTopics,
      facultyReport?.projects,
      facultyReport?.projectTopics,
      summary?.projects,
    ];

    for (const source of sources) {
      if (Array.isArray(source)) {
        return source;
      }
    }

    const projectMap = new Map<
      string,
      ReportRecord
    >();

    teams.forEach((team: ReportRecord) => {
      const project =
        getProjectFromTeam(team);

      if (
        !project ||
        Object.keys(project).length === 0
      ) {
        return;
      }

      const key = String(
        project?.id ||
          project?.projectCode ||
          project?.title ||
          project?.name ||
          ''
      );

      if (key) {
        projectMap.set(key, project);
      }
    });

    return Array.from(projectMap.values());
  }, [
    teamReport,
    facultyReport,
    summary,
    teams,
  ]);

  const sortedUnassigned = useMemo<
    ReportRecord[]
  >(() => {
    return [...unassigned].sort(
      (
        a: ReportRecord,
        b: ReportRecord
      ) => {
        const sectionA =
          normalizeSortValue(a?.section);

        const sectionB =
          normalizeSortValue(b?.section);

        const sectionCompare =
          sectionA.localeCompare(
            sectionB,
            undefined,
            {
              numeric: true,
              sensitivity: 'base',
            }
          );

        if (sectionCompare !== 0) {
          return sectionCompare;
        }

        const enrollmentA =
          normalizeSortValue(
            a?.enrollmentNo ||
              a?.enrollmentNumber
          );

        const enrollmentB =
          normalizeSortValue(
            b?.enrollmentNo ||
              b?.enrollmentNumber
          );

        const enrollmentCompare =
          enrollmentA.localeCompare(
            enrollmentB,
            undefined,
            {
              numeric: true,
              sensitivity: 'base',
            }
          );

        if (enrollmentCompare !== 0) {
          return enrollmentCompare;
        }

        const nameA =
          normalizeSortValue(
            a?.name ||
              a?.studentName ||
              a?.fullName ||
              a?.user?.name
          );

        const nameB =
          normalizeSortValue(
            b?.name ||
              b?.studentName ||
              b?.fullName ||
              b?.user?.name
          );

        return nameA.localeCompare(
          nameB,
          undefined,
          {
            numeric: true,
            sensitivity: 'base',
          }
        );
      }
    );
  }, [unassigned]);

  const unassignedBySection =
    useMemo<SectionGroup[]>(() => {
      const groups = new Map<
        string,
        SectionGroup
      >();

      sortedUnassigned.forEach(
        (student: ReportRecord) => {
          const rawSection = String(
            student?.section || ''
          ).trim();

          const normalizedSection = rawSection
            ? rawSection.toLowerCase()
            : 'section-not-assigned';

          const displayName = rawSection
            ? rawSection.toUpperCase()
            : 'Section Not Assigned';

          if (!groups.has(normalizedSection)) {
            groups.set(normalizedSection, {
              displayName,
              students: [],
            });
          }

          groups
            .get(normalizedSection)!
            .students.push(student);
        }
      );

      return Array.from(
        groups.values()
      ).sort(
        (
          a: SectionGroup,
          b: SectionGroup
        ) =>
          normalizeSortValue(
            a.displayName
          ).localeCompare(
            normalizeSortValue(
              b.displayName
            ),
            undefined,
            {
              numeric: true,
              sensitivity: 'base',
            }
          )
      );
    }, [sortedUnassigned]);

  const totalProjects =
    summary?.totalProjects ??
    summary?.projectsCount ??
    summary?.statistics?.totalProjects ??
    projects.length;

  const approvedProjects =
    summary?.approvedProjects ??
    summary?.approvedCount ??
    summary?.statistics?.approvedProjects ??
    0;

  const totalTeams =
    summary?.totalTeams ??
    summary?.teamsCount ??
    summary?.statistics?.totalTeams ??
    teams.length;

  const totalStudents =
    summary?.totalStudents ??
    summary?.studentsCount ??
    summary?.statistics?.totalStudents ??
    0;

  const unassignedStudents =
    summary?.unassignedStudents ??
    summary?.statistics?.unassignedStudents ??
    unassigned.length;

     const assignedStudents =
  summary?.assignedStudents ??
  summary?.allocatedStudents ??
  summary?.statistics?.assignedStudents ??
  (
    Number(totalStudents) -
    Number(unassignedStudents)
  );
  const facultyCount =
    summary?.facultyCount ??
    summary?.totalFaculty ??
    summary?.statistics?.facultyCount ??
    faculty.length;

  const handlePrint = () => {
    if (!printRef.current) {
      toast.error('Nothing to print');
      return;
    }

    const printWindow =
      window.open('', '_blank');

    if (!printWindow) {
      toast.error(
        'Please allow pop-ups to print the report'
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${poolName} - Project Allocation Report</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 24px;
              color: #111827;
              font-size: 12px;
            }

            h1 {
              font-size: 22px;
              margin: 0 0 6px;
            }

            h2 {
              font-size: 16px;
              margin: 22px 0 8px;
            }

            h3 {
              font-size: 14px;
              margin: 16px 0 8px;
            }

            p {
              margin: 4px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 6px;
              text-align: left;
              vertical-align: top;
            }

            th {
              font-weight: 700;
              background: #f3f4f6;
            }

            .section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }

            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin: 12px 0;
            }

            .summary-card {
              border: 1px solid #d1d5db;
              padding: 10px;
            }

            .summary-label {
              font-size: 10px;
              color: #6b7280;
            }

            .summary-value {
              font-size: 18px;
              font-weight: 700;
              margin-top: 4px;
            }

            @media print {
              body {
                margin: 12mm;
              }
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const exportAllReports = () => {
    try {
      const workbook =
        XLSX.utils.book_new();

      const selectedPoolData =
        pools.find(
          (pool) => pool.id === selectedPool
        );

      const academicYear =
        teamReport?.pool?.academicYear ||
        summary?.pool?.academicYear ||
        selectedPoolData?.academicYear ||
        'Report';

      const summaryRows: any[][] = [
        ['Project Allocation Report'],
        ['Pool', poolName],
        ['Academic Year', academicYear],
        [],
        ['Metric', 'Value'],
        ['Total Projects', totalProjects],
        ['Approved Projects', approvedProjects],
        ['Total Teams', totalTeams],
        ['Total Students', totalStudents],
        ['Assigned Students', assignedStudents],
        ['Unassigned Students', unassignedStudents],
        ['Faculty Count', facultyCount],
      ];

      const summarySheet =
        XLSX.utils.aoa_to_sheet(
          summaryRows
        );

      summarySheet['!cols'] = [
        { wch: 28 },
        { wch: 24 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        'Summary'
      );

      const teamRows: any[][] = [
        [
          'Team',
          'Project',
          'Project Code',
          'Faculty Guide',
          'Student Name',
          'Enrollment',
          'Email',
          'Role',
        ],
      ];

      teams.forEach(
        (
          team: ReportRecord,
          teamIndex: number
        ) => {
          const project =
            getProjectFromTeam(team);

          const facultyGuide =
            getFacultyFromProject(project);

          const teamName =
            team?.name ||
            team?.teamName ||
            team?.code ||
            `Team ${teamIndex + 1}`;

          const projectTitle =
            project?.title ||
            project?.projectTitle ||
            project?.name ||
            '—';

          const projectCode =
            project?.projectCode ||
            project?.code ||
            '—';

          const facultyName =
            facultyGuide?.name ||
            facultyGuide?.fullName ||
            `${facultyGuide?.firstName || ''} ${
              facultyGuide?.lastName || ''
            }`.trim() ||
            '—';

          const members =
            getProjectStudents(team);

          if (members.length === 0) {
            teamRows.push([
              teamName,
              projectTitle,
              projectCode,
              facultyName,
              '—',
              '—',
              '—',
              '—',
            ]);

            return;
          }

          members.forEach(
            (member: ReportRecord) => {
              const student =
                getStudentFromMember(member);

              teamRows.push([
                teamName,
                projectTitle,
                projectCode,
                facultyName,
                student?.name ||
                  student?.fullName ||
                  `${student?.firstName || ''} ${
                    student?.lastName || ''
                  }`.trim() ||
                  '—',
                student?.enrollmentNo ||
                  student?.enrollmentNumber ||
                  '—',
                student?.email || '—',
                member?.role ||
                  student?.role ||
                  'MEMBER',
              ]);
            }
          );
        }
      );

      const teamSheet =
        XLSX.utils.aoa_to_sheet(
          teamRows
        );

      teamSheet['!cols'] = [
        { wch: 18 },
        { wch: 34 },
        { wch: 18 },
        { wch: 28 },
        { wch: 28 },
        { wch: 22 },
        { wch: 34 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        teamSheet,
        'Team Report'
      );

      const facultyRows: any[][] = [
        [
          'Faculty ID',
          'Faculty Name',
          'Designation',
          'Email',
          'Status',
          'Total Topics',
          'Approved Projects',
        ],
      ];

      faculty.forEach(
        (item: ReportRecord) => {
          const facultyData =
            item?.faculty ||
            item?.user ||
            item;

          facultyRows.push([
            item?.facultyId ||
              facultyData?.facultyId ||
              '—',

            facultyData?.name ||
              facultyData?.fullName ||
              `${facultyData?.firstName || ''} ${
                facultyData?.lastName || ''
              }`.trim() ||
              '—',

            item?.designation ||
              facultyData?.designation ||
              '—',

            item?.email ||
              facultyData?.email ||
              '—',

            item?.status ||
              facultyData?.status ||
              '—',

            item?.totalTopics ??
              item?.topicCount ??
              item?.projectsCount ??
              item?.proposalCount ??
              item?.proposalCount ??
              0,

            item?.approvedProjects ??
              item?.approvedCount ??
              0,
          ]);
        }
      );

      const facultySheet =
        XLSX.utils.aoa_to_sheet(
          facultyRows
        );

      facultySheet['!cols'] = [
        { wch: 18 },
        { wch: 28 },
        { wch: 24 },
        { wch: 34 },
        { wch: 16 },
        { wch: 16 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        facultySheet,
        'Faculty Report'
      );

      const projectRows: any[][] = [
        [
          'Faculty ID',
          'Faculty Name',
          'Project Code',
          'Project Title',
          'Description',
          'Domain',
          'Maximum Team Size',
          'Status',
          'Proposed On',
          'Prerequisites',
          'Expected Outcome',
          'SubAdmin Note',
          'Admin Note',
        ],
      ];

      projects.forEach(
        (project: ReportRecord) => {
          const facultyData =
            getFacultyFromProject(
              project
            );

          projectRows.push([
            facultyData?.facultyId ||
              project?.facultyId ||
              '—',

            facultyData?.name ||
              facultyData?.fullName ||
              `${facultyData?.firstName || ''} ${
                facultyData?.lastName || ''
              }`.trim() ||
              '—',

            project?.projectCode ||
              project?.code ||
              '—',

            project?.title ||
              project?.projectTitle ||
              project?.name ||
              '—',

            project?.description || '—',

            project?.domain || '—',

            project?.maxTeamSize ??
              project?.maximumTeamSize ??
              project?.pool
                ?.defaultMaxTeamSize ??
              '—',

            project?.status || '—',

            formatDate(
              project?.createdAt ||
                project?.proposedAt ||
                project?.submittedAt
            ),

            project?.prerequisites || '—',

            project?.expectedOutcome ||
              project?.expectedResults ||
              '—',

            project?.subadminNote ||
              project?.subAdminNote ||
              '—',

            project?.adminNote || '—',
          ]);
        }
      );

      const projectSheet =
        XLSX.utils.aoa_to_sheet(
          projectRows
        );

      projectSheet['!cols'] = [
        { wch: 18 },
        { wch: 28 },
        { wch: 18 },
        { wch: 36 },
        { wch: 55 },
        { wch: 24 },
        { wch: 20 },
        { wch: 18 },
        { wch: 16 },
        { wch: 45 },
        { wch: 45 },
        { wch: 40 },
        { wch: 40 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        projectSheet,
        'Project Topics'
      );
     const facultyProjectRows: any[][] = [
  [
    'Faculty ID',
    'Faculty Name',
    'Project Code',
    'Project Title',
    'Status',
    'Assigned Team',
  ],
];

faculty.forEach((item: ReportRecord) => {
  const facultyData = item?.faculty || item?.user || item;
  const facultyName =
    facultyData?.name ||
    facultyData?.fullName ||
    `${facultyData?.firstName || ''} ${facultyData?.lastName || ''}`.trim() ||
    'Unknown Faculty';

  const facultyProjects: ReportRecord[] = Array.isArray(item?.proposals)
    ? item.proposals
    : [];

  if (facultyProjects.length === 0) {
    facultyProjectRows.push([
      facultyData?.facultyId || '—',
      facultyName,
      '—',
      'No projects submitted',
      '—',
      '—',
    ]);
    return;
  }

  facultyProjects.forEach((project: ReportRecord) => {
    facultyProjectRows.push([
      facultyData?.facultyId || '—',
      facultyName,
      project?.projectCode || 'Not assigned',
      project?.title || '—',
      project?.status || '—',
      project?.team?.name || 'Not assigned',
    ]);
  });
});

const facultyProjectSheet = XLSX.utils.aoa_to_sheet(facultyProjectRows);

facultyProjectSheet['!cols'] = [
  { wch: 18 },
  { wch: 28 },
  { wch: 18 },
  { wch: 40 },
  { wch: 18 },
  { wch: 28 },
];

XLSX.utils.book_append_sheet(
  workbook,
  facultyProjectSheet,
  'Faculty Projects'
);
      const unassignedRows: any[][] = [
        [
          'Section',
          'S.No.',
          'Student Name',
          'Enrollment',
          'Email',
        ],
      ];

      unassignedBySection.forEach(
        (group: SectionGroup) => {
          group.students.forEach(
            (
              student: ReportRecord,
              index: number
            ) => {
              unassignedRows.push([
                group.displayName,
                index + 1,
                student?.name ||
                  student?.studentName ||
                  student?.fullName ||
                  `${student?.firstName || ''} ${
                    student?.lastName || ''
                  }`.trim() ||
                  '—',
                student?.enrollmentNo ||
                  student?.enrollmentNumber ||
                  '—',
                student?.email ||
                  student?.user?.email ||
                  '—',
              ]);
            }
          );
        }
      );

      const unassignedSheet =
        XLSX.utils.aoa_to_sheet(
          unassignedRows
        );

      unassignedSheet['!cols'] = [
        { wch: 14 },
        { wch: 10 },
        { wch: 30 },
        { wch: 22 },
        { wch: 36 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        unassignedSheet,
        'Unassigned Students'
      );

      const safePoolName = poolName
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '');

      const safeAcademicYear =
        String(academicYear)
          .replace(/[^a-z0-9]+/gi, '_')
          .replace(/^_+|_+$/g, '');

      const filename =
        `Project_Allocation_Report_` +
        `${safePoolName || 'Pool'}_` +
        `${safeAcademicYear || 'Report'}.xlsx`;

      XLSX.writeFile(
        workbook,
        filename
      );

      toast.success(
        'Complete Excel report downloaded'
      );
    } catch (error) {
      console.error(
        'Excel export failed:',
        error
      );

      toast.error(
        'Failed to export Excel report'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reports
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Project allocation and student assignment
              reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={
                !selectedPool ||
                loadingReports
              }
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={17} />
              Print
            </button>

            <button
              type="button"
              onClick={exportAllReports}
              disabled={
                !selectedPool ||
                loadingReports
              }
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              Export Complete Excel
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <label
            htmlFor="report-pool"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Pool
          </label>

          <select
            id="report-pool"
            value={selectedPool}
            onChange={(event) =>
              setSelectedPool(
                event.target.value
              )
            }
            className="w-full max-w-xl rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          >
            <option value="">
              Select pool
            </option>

            {pools.map((pool: Pool) => (
              <option
                key={pool.id}
                value={pool.id}
              >
                {pool.name}
                {pool.academicYear
                  ? ` — ${pool.academicYear}`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {!selectedPool ? (
          <EmptyState
            title="Select a pool"
            subtitle="Select a pool to view project allocation reports."
          />
        ) : loadingReports ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto border-b border-gray-200">
              <button
                type="button"
                onClick={() =>
                  setTab('summary')
                }
                className={`whitespace-nowrap border-b-2 px-2 pb-3 text-sm font-medium ${
                  tab === 'summary'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Summary
              </button>

              <button
                type="button"
                onClick={() =>
                  setTab('teams')
                }
                className={`whitespace-nowrap border-b-2 px-2 pb-3 text-sm font-medium ${
                  tab === 'teams'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Teams
              </button>

              <button
                type="button"
                onClick={() =>
                  setTab('faculty')
                }
                className={`whitespace-nowrap border-b-2 px-2 pb-3 text-sm font-medium ${
                  tab === 'faculty'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Faculty
              </button>

              <button
                type="button"
                onClick={() =>
                  setTab('unassigned')
                }
                className={`whitespace-nowrap border-b-2 px-2 pb-3 text-sm font-medium ${
                  tab === 'unassigned'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Unassigned Students
              </button>
            </div>

            {tab === 'summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Total Projects
                      </p>
                      <BarChart3 size={20} />
                    </div>

                    <p className="mt-3 text-3xl font-bold text-gray-900">
                      {totalProjects}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Approved Projects
                      </p>
                      <UserCheck size={20} />
                    </div>

                    <p className="mt-3 text-3xl font-bold text-gray-900">
                      {approvedProjects}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Teams
                      </p>
                      <Users size={20} />
                    </div>

                    <p className="mt-3 text-3xl font-bold text-gray-900">
                      {totalTeams}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Unassigned Students
                      </p>
                      <UserX size={20} />
                    </div>

                    <p className="mt-3 text-3xl font-bold text-gray-900">
                      {unassignedStudents}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">
                      Total Students
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {totalStudents}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">
                      Assigned Students
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {assignedStudents}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">
                      Faculty
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {facultyCount}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'teams' && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {teams.length === 0 ? (
                  <EmptyState
                    title="No teams found"
                    subtitle="There are no teams available for this pool."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Team
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Project
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Project Code
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Faculty Guide
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Students
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {teams.map(
                          (
                            team: ReportRecord,
                            index: number
                          ) => {
                            const project =
                              getProjectFromTeam(
                                team
                              );

                            const facultyGuide =
                              getFacultyFromProject(
                                project
                              );

                            const members =
                              getProjectStudents(
                                team
                              );

                            const teamName =
                              team?.name ||
                              team?.teamName ||
                              team?.code ||
                              `Team ${index + 1}`;

                            return (
                              <tr
                                key={
                                  team?.id ||
                                  index
                                }
                              >
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                  {displayValue(
                                    teamName
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-gray-700">
                                  {displayValue(
                                    project?.title ||
                                      project?.projectTitle ||
                                      project?.name
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-gray-700">
                                  {displayValue(
                                    project?.projectCode ||
                                      project?.code
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-gray-700">
                                  {displayValue(
                                    facultyGuide?.name ||
                                      facultyGuide?.fullName ||
                                      `${facultyGuide?.firstName || ''} ${
                                        facultyGuide?.lastName || ''
                                      }`.trim()
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-gray-700">
                                  {members.length ===
                                  0 ? (
                                    '—'
                                  ) : (
                                    <div className="space-y-1">
                                      {members.map(
                                        (
                                          member: ReportRecord,
                                          memberIndex: number
                                        ) => {
                                          const student =
                                            getStudentFromMember(
                                              member
                                            );

                                          return (
                                            <div
                                              key={
                                                member?.id ||
                                                student?.id ||
                                                memberIndex
                                              }
                                            >
                                              {displayValue(
                                                student?.name ||
                                                  student?.fullName ||
                                                  `${student?.firstName || ''} ${
                                                    student?.lastName || ''
                                                  }`.trim()
                                              )}
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'faculty' && (
              <div className="space-y-3">
                {faculty.length === 0 ? (
                  <EmptyState
                    title="No faculty report"
                    subtitle="No faculty information is available for this pool."
                  />
                ) : (
                  faculty.map(
                    (
                      item: ReportRecord,
                      index: number
                    ) => {
                      const facultyData =
                        item?.faculty ||
                        item?.user ||
                        item;
                  const facultyProjects: ReportRecord[] = Array.isArray(
  item?.proposals
)
  ? item.proposals
  : [];
                      const facultyId =
                        item?.facultyId ||
                        facultyData?.facultyId ||
                        facultyData?.id ||
                        String(index + 1);

                      const facultyName =
                        facultyData?.name ||
                        facultyData?.fullName ||
                        `${facultyData?.firstName || ''} ${
                          facultyData?.lastName || ''
                        }`.trim() ||
                        'Unknown Faculty';

                      const isExpanded =
                        expandedFaculty ===
                        String(facultyId);

                      return (
                        <div
                          key={String(
                            facultyId
                          )}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedFaculty(
                                isExpanded
                                  ? null
                                  : String(
                                      facultyId
                                    )
                              )
                            }
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">
                                {facultyName}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {displayValue(
                                  facultyId
                                )}

                                {facultyData?.designation
                                  ? ` · ${facultyData.designation}`
                                  : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge
                                text={`${item?.approvedProjects ?? item?.approvedCount ?? 0} approved`}
                              />

                              <span className="text-gray-400">
                                {isExpanded
                                  ? '−'
                                  : '+'}
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <p className="text-xs uppercase text-gray-500">
                                    Faculty ID
                                  </p>

                                  <p className="mt-1 text-sm font-medium">
                                    {displayValue(
                                      facultyId
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase text-gray-500">
                                    Email
                                  </p>

                                  <p className="mt-1 text-sm font-medium">
                                    {displayValue(
                                      item?.email ||
                                        facultyData?.email
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase text-gray-500">
                                    Total Topics
                                  </p>

                                  <p className="mt-1 text-sm font-medium">
                                    {item?.totalTopics ??
                                      item?.topicCount ??
                                      0}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase text-gray-500">
                                    Approved Projects
                                  </p>

                                  <p className="mt-1 text-sm font-medium">
                                    {item?.approvedProjects ??
                                      item?.approvedCount ??
                                      0}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-6">
  <h3 className="mb-3 text-sm font-semibold text-gray-900">
    Submitted Projects ({facultyProjects.length})
  </h3>

  {facultyProjects.length === 0 ? (
    <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
      No projects submitted by this faculty.
    </p>
  ) : (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Project Code
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Project Title
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Assigned Team
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {facultyProjects.map((project: ReportRecord) => (
            <tr key={project.id}>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {displayValue(
                  project.projectCode,
                  'Not assigned'
                )}
              </td>

              <td className="min-w-[200px] px-4 py-3 text-gray-700">
                {displayValue(project.title)}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {displayValue(project.status)}
                </span>
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                {displayValue(
                  project.team?.name,
                  'Not assigned'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
                            </div>
                            
                          )}
                        </div>
                      );
                    }
                  )
                )}
              </div>
            )}

            {tab === 'unassigned' && (
              <div className="space-y-6">
                {unassignedBySection.length ===
                0 ? (
                  <EmptyState
                    title="No unassigned students"
                    subtitle="All students in this pool are currently assigned."
                  />
                ) : (
                  unassignedBySection.map(
                    (
                      group: SectionGroup
                    ) => (
                      <div
                        key={group.displayName}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                      >
                        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                          <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">
                              Section{' '}
                              {group.displayName}
                            </h2>

                            <Badge
                              text={`${group.students.length} student${group.students.length === 1 ? '' : 's'}`}
                            />
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                  S.No.
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                  Student Name
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                  Enrollment
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                  Email
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                              {group.students.map(
                                (
                                  student: ReportRecord,
                                  index: number
                                ) => (
                                  <tr
                                    key={
                                      student?.id ||
                                      student?.enrollmentNo ||
                                      index
                                    }
                                  >
                                    <td className="px-5 py-3 text-sm text-gray-700">
                                      {index + 1}
                                    </td>

                                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                                      {displayValue(
                                        student?.name ||
                                          student?.studentName ||
                                          student?.fullName ||
                                          `${student?.firstName || ''} ${
                                            student?.lastName || ''
                                          }`.trim()
                                      )}
                                    </td>

                                    <td className="px-5 py-3 text-sm text-gray-700">
                                      {displayValue(
                                        student?.enrollmentNo ||
                                          student?.enrollmentNumber
                                      )}
                                    </td>

                                    <td className="px-5 py-3 text-sm text-gray-700">
                                      {displayValue(
                                        student?.email ||
                                          student?.user?.email
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div
        ref={printRef}
        className="hidden"
      >
        <div>
          <h1>Project Allocation Report</h1>

          <p>
            <strong>Pool:</strong>{' '}
            {poolName}
          </p>

          <p>
            <strong>Academic Year:</strong>{' '}
            {displayValue(
              teamReport?.pool?.academicYear ||
                summary?.pool?.academicYear ||
                pools.find(
                  (pool) =>
                    pool.id ===
                    selectedPool
                )?.academicYear
            )}
          </p>
        </div>

        <div className="section">
          <h2>Summary</h2>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">
                Total Projects
              </div>

              <div className="summary-value">
                {totalProjects}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">
                Approved Projects
              </div>

              <div className="summary-value">
                {approvedProjects}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">
                Total Teams
              </div>

              <div className="summary-value">
                {totalTeams}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">
                Unassigned Students
              </div>

              <div className="summary-value">
                {unassignedStudents}
              </div>
            </div>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Total Students</th>
                <td>{totalStudents}</td>
              </tr>

              <tr>
                <th>Assigned Students</th>
                <td>{assignedStudents}</td>
              </tr>

              <tr>
                <th>Faculty</th>
                <td>{facultyCount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <h2>Team Report</h2>

          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Project</th>
                <th>Project Code</th>
                <th>Faculty Guide</th>
                <th>Student Name</th>
                <th>Enrollment</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>

            <tbody>
              {teams.map(
                (
                  team: ReportRecord,
                  teamIndex: number
                ) => {
                  const project =
                    getProjectFromTeam(
                      team
                    );

                  const facultyGuide =
                    getFacultyFromProject(
                      project
                    );

                  const members =
                    getProjectStudents(
                      team
                    );

                  const teamName =
                    team?.name ||
                    team?.teamName ||
                    team?.code ||
                    `Team ${teamIndex + 1}`;

                  if (
                    members.length === 0
                  ) {
                    return (
                      <tr
                        key={
                          team?.id ||
                          teamIndex
                        }
                      >
                        <td>
                          {teamName}
                        </td>

                        <td>
                          {displayValue(
                            project?.title ||
                              project?.projectTitle ||
                              project?.name
                          )}
                        </td>

                        <td>
                          {displayValue(
                            project?.projectCode ||
                              project?.code
                          )}
                        </td>

                        <td>
                          {displayValue(
                            facultyGuide?.name ||
                              facultyGuide?.fullName
                          )}
                        </td>

                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    );
                  }

                  return members.map(
                    (
                      member: ReportRecord,
                      memberIndex: number
                    ) => {
                      const student =
                        getStudentFromMember(
                          member
                        );

                      return (
                        <tr
                          key={`${team?.id || teamIndex}-${member?.id || memberIndex}`}
                        >
                          <td>
                            {teamName}
                          </td>

                          <td>
                            {displayValue(
                              project?.title ||
                                project?.projectTitle ||
                                project?.name
                            )}
                          </td>

                          <td>
                            {displayValue(
                              project?.projectCode ||
                                project?.code
                            )}
                          </td>

                          <td>
                            {displayValue(
                              facultyGuide?.name ||
                                facultyGuide?.fullName ||
                                `${facultyGuide?.firstName || ''} ${
                                  facultyGuide?.lastName || ''
                                }`.trim()
                            )}
                          </td>

                          <td>
                            {displayValue(
                              student?.name ||
                                student?.fullName ||
                                `${student?.firstName || ''} ${
                                  student?.lastName || ''
                                }`.trim()
                            )}
                          </td>

                          <td>
                            {displayValue(
                              student?.enrollmentNo ||
                                student?.enrollmentNumber
                            )}
                          </td>

                          <td>
                            {displayValue(
                              student?.email
                            )}
                          </td>

                          <td>
                            {displayValue(
                              member?.role ||
                                student?.role,
                              'MEMBER'
                            )}
                          </td>
                        </tr>
                      );
                    }
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        <div className="section">
          <h2>Faculty Report</h2>

          <table>
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Faculty Name</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Status</th>
                <th>Total Topics</th>
                <th>Approved Projects</th>
              </tr>
            </thead>

            <tbody>
              {faculty.map(
                (
                  item: ReportRecord,
                  index: number
                ) => {
                  const facultyData =
                    item?.faculty ||
                    item?.user ||
                    item;

                  return (
                    <tr
                      key={
                        item?.id ||
                        facultyData?.id ||
                        index
                      }
                    >
                      <td>
                        {displayValue(
                          item?.facultyId ||
                            facultyData?.facultyId
                        )}
                      </td>

                      <td>
                        {displayValue(
                          facultyData?.name ||
                            facultyData?.fullName ||
                            `${facultyData?.firstName || ''} ${
                              facultyData?.lastName || ''
                            }`.trim()
                        )}
                      </td>

                      <td>
                        {displayValue(
                          item?.designation ||
                            facultyData?.designation
                        )}
                      </td>

                      <td>
                        {displayValue(
                          item?.email ||
                            facultyData?.email
                        )}
                      </td>

                      <td>
                        {displayValue(
                          item?.status ||
                            facultyData?.status
                        )}
                      </td>

                      <td>
                        {item?.totalTopics ??
                          item?.topicCount ??
                          0}
                      </td>

                      <td>
                        {item?.approvedProjects ??
                          item?.approvedCount ??
                          0}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
       <div className="section">
  <h2>Faculty Submitted Projects</h2>

  {faculty.map((item: ReportRecord, index: number) => {
    const facultyData = item?.faculty || item?.user || item;
    const facultyName =
      facultyData?.name ||
      facultyData?.fullName ||
      `${facultyData?.firstName || ''} ${facultyData?.lastName || ''}`.trim() ||
      'Unknown Faculty';
    const facultyProjects: ReportRecord[] = Array.isArray(item?.proposals)
      ? item.proposals
      : [];

    return (
      <div key={item?.id || facultyData?.id || index}>
        <h3>{facultyName}</h3>

        {facultyProjects.length === 0 ? (
          <p>No projects submitted.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Project Code</th>
                <th>Project Title</th>
                <th>Status</th>
                <th>Assigned Team</th>
              </tr>
            </thead>
            <tbody>
              {facultyProjects.map((project: ReportRecord) => (
                <tr key={project.id}>
                  <td>{displayValue(project.projectCode, 'Not assigned')}</td>
                  <td>{displayValue(project.title)}</td>
                  <td>{displayValue(project.status)}</td>
                  <td>{displayValue(project.team?.name, 'Not assigned')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  })}
</div>
        <div className="section">
          <h2>Project Topics</h2>

          <table>
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Faculty Name</th>
                <th>Project Code</th>
                <th>Project Title</th>
                <th>Description</th>
                <th>Domain</th>
                <th>Maximum Team Size</th>
                <th>Status</th>
                <th>Proposed On</th>
              </tr>
            </thead>

            <tbody>
              {projects.map(
                (
                  project: ReportRecord,
                  index: number
                ) => {
                  const facultyData =
                    getFacultyFromProject(
                      project
                    );

                  return (
                    <tr
                      key={
                        project?.id ||
                        project?.projectCode ||
                        index
                      }
                    >
                      <td>
                        {displayValue(
                          facultyData?.facultyId ||
                            project?.facultyId
                        )}
                      </td>

                      <td>
                        {displayValue(
                          facultyData?.name ||
                            facultyData?.fullName ||
                            `${facultyData?.firstName || ''} ${
                              facultyData?.lastName || ''
                            }`.trim()
                        )}
                      </td>

                      <td>
                        {displayValue(
                          project?.projectCode ||
                            project?.code
                        )}
                      </td>

                      <td>
                        {displayValue(
                          project?.title ||
                            project?.projectTitle ||
                            project?.name
                        )}
                      </td>

                      <td>
                        {displayValue(
                          project?.description
                        )}
                      </td>

                      <td>
                        {displayValue(
                          project?.domain
                        )}
                      </td>

                      <td>
                        {displayValue(
                          project?.maxTeamSize ??
                            project?.maximumTeamSize
                        )}
                      </td>

                      <td>
                        {displayValue(
                          project?.status
                        )}
                      </td>

                      <td>
                        {formatDate(
                          project?.createdAt ||
                            project?.proposedAt ||
                            project?.submittedAt
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        <div className="section">
          <h2>Unassigned Students</h2>

          {unassignedBySection.map(
            (
              group: SectionGroup
            ) => (
              <div
                key={group.displayName}
              >
                <h3>
                  Section{' '}
                  {group.displayName}
                </h3>

                <table>
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Student Name</th>
                      <th>Enrollment</th>
                      <th>Email</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.students.map(
                      (
                        student: ReportRecord,
                        index: number
                      ) => (
                        <tr
                          key={
                            student?.id ||
                            student?.enrollmentNo ||
                            index
                          }
                        >
                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {displayValue(
                              student?.name ||
                                student?.studentName ||
                                student?.fullName ||
                                `${student?.firstName || ''} ${
                                  student?.lastName || ''
                                }`.trim()
                            )}
                          </td>

                          <td>
                            {displayValue(
                              student?.enrollmentNo ||
                                student?.enrollmentNumber
                            )}
                          </td>

                          <td>
                            {displayValue(
                              student?.email ||
                                student?.user?.email
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default ReportsPage;