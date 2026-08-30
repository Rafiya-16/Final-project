// frontend/src/pages/admin/ReportsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { poolService } from '@/services/poolService';
import { reportService } from '@/services/reportService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/lib/utils';
import { Printer, Download, BarChart3, ChevronDown, ChevronRight, Users, FileText, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Pool } from '@/types';

const ReportsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [tab, setTab] = useState<'summary' | 'teams' | 'faculty' | 'unassigned'>('summary');
  const [summary, setSummary] = useState<any>(null);
  const [teamReport, setTeamReport] = useState<any>(null);
  const [facultyReport, setFacultyReport] = useState<any>(null);
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    poolService.list().then(r => {
      const p = r.data || [];
      setPools(p);
      if (p.length) setSelectedPool(p[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPool) return;
    setLoading(true);
    Promise.all([
      reportService.summary(selectedPool),
      reportService.teamReport(selectedPool),
      reportService.facultyReport(selectedPool), 
      reportService.unassigned(selectedPool),
    ]).then(([s, t, f, u]) => {
      setSummary(s); setTeamReport(t); setFacultyReport(f); setUnassigned(u || []);
    }).catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [selectedPool]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${teamReport?.pool?.name || 'Report'} - Project Allocation Report</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 2cm; color: #1a1a1a; }
            h1 { text-align: center; color: #1e40af; margin-bottom: 5px; }
            h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; }
            h3 { color: #1e40af; margin-top: 20px; }
            .subtitle { text-align: center; color: #6b7280; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
            .stat-value { font-size: 28px; font-weight: bold; color: #1e40af; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
            th { background: #f3f4f6; text-align: left; padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; }
            td { padding: 8px 10px; border: 1px solid #e5e7eb; }
            tr:nth-child(even) { background: #f9fafb; }
            .team-block { margin-bottom: 25px; page-break-inside: avoid; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
            .badge-leader { background: #fef3c7; color: #92400e; }
            .timestamp { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
            @media print { body { margin: 1cm; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <div class="timestamp">Generated: ${new Date().toLocaleString()} | ProjectAlloc Platform</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportCSV = () => {
    if (!teamReport?.teams) return;
    const rows = [['Team', 'Project', 'Faculty', 'Student Name', 'Enrollment', 'Email', 'Role']];
    teamReport.teams.forEach((t: any) => {
      t.members?.forEach((m: any) => {
        rows.push([
          t.name, t.project?.title || 'Unassigned',
          t.project?.faculty ? `${t.project.faculty.firstName} ${t.project.faculty.lastName}` : '',
          `${m.student.firstName} ${m.student.lastName}`, m.student.enrollmentNo || '',
          m.student.email, m.role
        ]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `team_report_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  if (loading && !summary) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-3">
          <select value={selectedPool} onChange={e => setSelectedPool(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm outline-none">
            {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <Printer className="w-4 h-4" />Print
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {[
          { key: 'summary', label: 'Summary', icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'teams', label: 'Team Report', icon: <Users className="w-4 h-4" /> },
          { key: 'faculty', label: 'Faculty Report', icon: <FileText className="w-4 h-4" /> },
          { key: 'unassigned', label: `Unassigned (${unassigned.length})`, icon: <UserX className="w-4 h-4" /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{t.icon}{t.label}</button>
        ))}
      </div>

      {/* Summary Tab */}
      {tab === 'summary' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: summary.totalStudents, color: 'text-blue-600' },
              { label: 'Total Faculty', value: summary.totalFaculty, color: 'text-purple-600' },
              { label: 'Approved Projects', value: `${summary.approvedProjects}/${summary.totalProjects}`, color: 'text-green-600' },
              { label: 'Teams Formed', value: summary.totalTeams, color: 'text-orange-600' },
              { label: 'Frozen Teams', value: summary.frozenTeams, color: 'text-cyan-600' },
              { label: 'Unassigned Students', value: summary.unassignedStudents, color: summary.unassignedStudents > 0 ? 'text-red-600' : 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Projects by Status</h3>
            <div className="space-y-3">
              {summary.projectsByStatus?.map((p: any) => {
                const pct = summary.totalProjects > 0 ? Math.round((p.count / summary.totalProjects) * 100) : 0;
                return (
                  <div key={p.status} className="flex items-center gap-4">
                    <Badge text={p.status} className="w-28 text-center" />
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-mono text-gray-600 w-16 text-right">{p.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Teams Tab */}
     {tab === 'teams' && (
  <div className="space-y-4">
    {!teamReport?.teams?.length ? (
      <EmptyState title="No teams formed yet" />
    ) : (
      teamReport.teams.map((team: any, idx: number) => (
        <div
          key={team.id}
          className="bg-white rounded-xl border p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                Team #{idx + 1}: {team.name}
              </h3>

              {team.project ? (
                <div className="mt-1">
                  <p className="text-sm text-gray-600">
                    Project:{' '}
                    <span className="font-medium text-gray-900">
                      {team.project.title}
                    </span>

                    {team.project.projectCode && (
                      <span className="ml-2 font-semibold text-gray-900">
                        ({team.project.projectCode})
                      </span>
                    )}

                    {team.project.faculty && (
                      <span className="text-gray-400">
                        {' '}• Guide:{' '}
                        {team.project.faculty.firstName}{' '}
                        {team.project.faculty.lastName}
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-500 mt-1">
                  No project selected
                </p>
              )}
            </div>

            <Badge text={team.status} />
          </div>

          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Enrollment
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Role
                </th>
              </tr>
            </thead>

            <tbody>
              {team.members?.map((m: any, mi: number) => (
                <tr
                  key={m.id}
                  className="border-t"
                >
                  <td className="px-3 py-2 text-gray-500">
                    {mi + 1}
                  </td>

                  <td className="px-3 py-2 font-medium">
                    {m.student.firstName}{' '}
                    {m.student.lastName}
                  </td>

                  <td className="px-3 py-2 font-mono text-gray-600">
                    {m.student.enrollmentNo || '—'}
                  </td>

                  <td className="px-3 py-2 text-gray-600">
                    {m.student.email}
                  </td>

                  <td className="px-3 py-2">
                    {m.role === 'LEADER' ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        Leader
                      </span>
                    ) : (
                      'Member'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))
    )}
  </div>
)}

{/* Faculty Report Tab */}
{tab === 'faculty' && (
  <div className="space-y-6">

    {/* Faculty Report Summary */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <div className="bg-white rounded-xl border p-5">
        <p className="text-sm text-gray-500">
          Total Faculty
        </p>

        <p className="text-3xl font-bold text-purple-600 mt-1">
          {facultyReport?.totalFaculty || 0}
        </p>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-sm text-gray-500">
          Total Topics Proposed
        </p>

        <p className="text-3xl font-bold text-blue-600 mt-1">
          {facultyReport?.totalProposals || 0}
        </p>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-sm text-gray-500">
          Approved Projects
        </p>

        <p className="text-3xl font-bold text-green-600 mt-1">
          {facultyReport?.faculty?.reduce(
            (total: number, item: any) =>
              total +
              (item.proposals?.filter(
                (project: any) =>
                  project.status === 'APPROVED'
              ).length || 0),
            0
          ) || 0}
        </p>
      </div>

    </div>

    {/* Faculty List */}
    <div className="bg-white rounded-xl border overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">
          Faculty Project Report
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Click on a faculty member to view their proposed
          project topics.
        </p>
      </div>

      {!facultyReport?.faculty?.length ? (
        <div className="p-10 text-center">
          <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />

          <p className="text-gray-500">
            No faculty found for this pool.
          </p>
        </div>
      ) : (
        <div className="divide-y">

          {facultyReport.faculty.map((item: any) => {
            const faculty = item.faculty;

            const isExpanded =
              expandedFaculty === faculty.id;

            const approvedProjects =
              item.proposals?.filter(
                (project: any) =>
                  project.status === 'APPROVED'
              ).length || 0;

            return (
              <div key={faculty.id}>

                {/* Faculty Row */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedFaculty(
                      isExpanded ? null : faculty.id
                    )
                  }
                  className="w-full text-left px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                    {/* Expand Icon */}
                    <div className="md:col-span-1">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </div>

                    {/* Faculty ID */}
                    <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            faculty.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {faculty.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </span>
</div>
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Faculty ID
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        {faculty.facultyId || '—'}
                      </p>             
                 </div>            
                    {/* Faculty Name */}
                    <div className="md:col-span-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Faculty Name
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        {faculty.firstName}{' '}
                        {faculty.lastName}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {faculty.designation || 'Faculty'}
                      </p>
                    </div>
                  <div>
                          <p className="text-xs text-gray-400 uppercase">
                            Email
                          </p>
                          <p className="text-sm text-gray-800 mt-1 break-all">
                            {faculty.email || '—'}
                          </p>
                        </div>
                    {/* Approved Projects */}
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Approved Projects
                      </p>

                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                          {approvedProjects}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="md:col-span-2 flex justify-end">
                      <span className="text-sm font-medium text-blue-600">
                        {isExpanded
                          ? 'Hide Details'
                          : 'View Details'}
                      </span>
                    </div>

                  </div>
                </button>

                {/* Expanded Faculty Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 bg-gray-50 border-t">
                    
                    {/* Project Details */}
                    <div className="mt-5">

                      <div className="flex items-center justify-between mb-4">

                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Project Topics
                          </h4>

                          <p className="text-sm text-gray-500 mt-1">
                            {item.proposalCount || 0}{' '}
                            {item.proposalCount === 1
                              ? 'topic'
                              : 'topics'}{' '}
                            proposed
                          </p>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                          {approvedProjects} Approved
                        </span>

                      </div>

                      {!item.proposals?.length ? (
                        <div className="bg-white border border-dashed rounded-lg p-8 text-center">

                          <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />

                          <p className="text-sm text-gray-500">
                            No project topics proposed by this
                            faculty member.
                          </p>

                        </div>
                      ) : (
                        <div className="space-y-4">

                          {item.proposals.map(
                            (
                              project: any,
                              index: number
                            ) => (
                              <div
                                key={project.id}
                                className="bg-white rounded-lg border p-5"
                              >

                                {/* Project Header */}
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

                                  <div className="flex gap-3">

                                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                                      {index + 1}
                                    </div>

                                    <div>
                                      <h5 className="font-semibold text-gray-900">
  {project.title}
  {project.projectCode && (
    <span className="text-black-600 ml-1">
      • ({project.projectCode})
    </span>
  )}
</h5>

                                      <p className="text-xs text-gray-400 mt-1">
                                        Proposed on{' '}
                                        {project.createdAt
                                          ? new Date(
                                              project.createdAt
                                            ).toLocaleDateString()
                                          : '—'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Description */}
                                <div className="mt-5">

                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Description
                                  </p>

                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {project.description ||
                                      'No description provided.'}
                                  </p>

                                </div>

                                {/* Project Information */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">

                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                      Domain
                                    </p>

                                    <p className="text-sm text-gray-700 mt-1">
                                      {project.domain ||
                                        '—'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                      Maximum Team Size
                                    </p>

                                    <p className="text-sm text-gray-700 mt-1">
                                      {project.maxTeamSize ||
                                        '—'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                      Status
                                    </p>

                                    <div className="mt-1">
                                      <Badge
                                        text={
                                          project.status
                                        }
                                      />
                                    </div>
                                  </div>

                                </div>

                                {/* Prerequisites */}
                                {project.prerequisites && (
                                  <div className="mt-5">

                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                      Prerequisites
                                    </p>

                                    <p className="text-sm text-gray-700">
                                      {project.prerequisites}
                                    </p>

                                  </div>
                                )}

                                {/* Expected Outcome */}
                                {project.expectedOutcome && (
                                  <div className="mt-5">

                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                      Expected Outcome
                                    </p>

                                    <p className="text-sm text-gray-700">
                                      {project.expectedOutcome}
                                    </p>

                                  </div>
                                )}

                                {/* Review Notes */}
                                {(project.subadminNote ||
                                  project.adminNote) && (
                                  <div className="mt-5 pt-5 border-t">

                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                                      Review Notes
                                    </p>

                                    {project.subadminNote && (
                                      <div className="mb-3">
                                        <p className="text-xs font-medium text-purple-600">
                                          SubAdmin
                                        </p>

                                        <p className="text-sm text-gray-700 mt-1">
                                          {
                                            project.subadminNote
                                          }
                                        </p>
                                      </div>
                                    )}

                                    {project.adminNote && (
                                      <div>
                                        <p className="text-xs font-medium text-blue-600">
                                          Admin
                                        </p>

                                        <p className="text-sm text-gray-700 mt-1">
                                          {
                                            project.adminNote
                                          }
                                        </p>
                                      </div>
                                    )}

                                  </div>
                                )}

                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}

    </div>

  </div>
)}

      {/* Unassigned Tab */}
      {tab === 'unassigned' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {unassigned.length === 0 ? (
            <div className="p-8 text-center text-green-600">
              <Users className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p className="font-medium">All students assigned!</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Enrollment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Section</th>
              </tr></thead>
              <tbody className="divide-y">
                {unassigned.map((s: any, i: number) => (
                  <tr key={s.id} className="hover:bg-red-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{s.enrollmentNo}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3">{s.section || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Hidden printable content */}
      <div ref={printRef} className="hidden">
        <h1>{teamReport?.pool?.name || 'Pool'}</h1>
        <div className="subtitle">{teamReport?.pool?.academicYear} — {teamReport?.pool?.semester} Semester</div>

        {summary && (
          <>
            <h2>Summary</h2>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{summary.totalStudents}</div><div className="stat-label">Students</div></div>
              <div className="stat-card"><div className="stat-value">{summary.totalFaculty}</div><div className="stat-label">Faculty</div></div>
              <div className="stat-card"><div className="stat-value">{summary.approvedCount}</div><div className="stat-label">Approved Projects</div></div>
              <div className="stat-card"><div className="stat-value">{summary.totalTeams}</div><div className="stat-label">Teams</div></div>
            </div>
          </>
        )}

        <h2>Team Allocations</h2>
        {teamReport?.teams?.map((team: any, idx: number) => (
          <div key={team.id} className="team-block">
            <h3>Team #{idx + 1}: {team.name}</h3>
            <p><strong>Project:</strong> {team.project?.title || 'Not assigned'}</p>
            {team.project?.faculty && <p><strong>Faculty Guide:</strong> {team.project.faculty.firstName} {team.project.faculty.lastName}</p>}
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Enrollment</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>
                {team.members?.map((m: any, mi: number) => (
                  <tr key={m.id}>
                    <td>{mi + 1}</td>
                    <td>{m.student.firstName} {m.student.lastName}</td>
                    <td>{m.student.enrollmentNo || '—'}</td>
                    <td>{m.student.email}</td>
                    <td>{m.role === 'LEADER' ? '👑 Leader' : 'Member'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {unassigned.length > 0 && (
          <>
            <h2>Unassigned Students ({unassigned.length})</h2>
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Enrollment</th><th>Email</th></tr></thead>
              <tbody>
                {unassigned.map((s: any, i: number) => (
                  <tr key={s.id}><td>{i + 1}</td><td>{s.firstName} {s.lastName}</td><td>{s.enrollmentNo}</td><td>{s.email}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;