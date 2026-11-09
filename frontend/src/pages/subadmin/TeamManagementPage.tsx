import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, RefreshCw, ShieldCheck, UserPlus, Users, UserMinus, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { poolService } from '@/services/poolService';
import { teamService } from '@/services/teamService';

type Student = { id: string; firstName: string; lastName: string; email: string; enrollmentNo?: string | null; section?: string | null; semester?: number | null };
type Member = { id: string; studentId: string; role: string; student: Student };
type Team = { id: string; name: string; status: string; isFrozen: boolean; leaderId: string; members: Member[]; project?: { title: string; projectCode?: string | null } | null };
type Pool = { id: string; name: string; academicYear?: string; semester?: string };

const fullName = (s: Student) => [s.firstName, s.lastName].filter(Boolean).join(' ');

const SubadminTeamManagementPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [poolId, setPoolId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [reason, setReason] = useState('');
  const [teamReasons, setTeamReasons] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [memberSelections, setMemberSelections] = useState<Record<string, string>>({});
  const [renameValues, setRenameValues] = useState<Record<string, string>>({});

  const loadPools = useCallback(async () => {
    try {
      const response = await poolService.list(1, 'subadmin');
      const rows = Array.isArray(response?.data) ? response.data : [];
      setPools(rows);
      if (rows.length && !poolId) setPoolId(rows[0].id);
    } catch { toast.error('Unable to load assigned pools.'); }
  }, [poolId]);

  const loadData = useCallback(async () => {
    if (!poolId) return;
    setLoading(true);
    try {
      const data = await teamService.adminManagement(poolId);
      setTeams(Array.isArray(data?.teams) ? data.teams : []);
      setStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load team management data.');
    } finally { setLoading(false); }
  }, [poolId]);

  useEffect(() => { void loadPools(); }, [loadPools]);
  useEffect(() => { void loadData(); }, [loadData]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s => !q || [fullName(s), s.enrollmentNo, s.section, s.email].some(v => String(v || '').toLowerCase().includes(q)));
  }, [students, search]);

  const eligibleForCreation = students.filter(s => selectedStudents.includes(s.id));
  const mutate = async (action: () => Promise<unknown>, auditReason = reason, clearCreateReason = true) => {
    if (auditReason.trim().length < 10) { toast.error('Enter a reason of at least 10 characters for the audit record.'); return; }
    setBusy(true);
    try { await action(); toast.success('Team changes saved.'); if (clearCreateReason) { setReason(''); setSelectedStudents([]); } await loadData(); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'The team change could not be completed.'); }
    finally { setBusy(false); }
  };

  const toggleStudent = (id: string) => setSelectedStudents(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"><ShieldCheck className="h-4 w-4" /> Subadmin controls</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create cross-section teams and manage memberships, including after team freeze.</p>
        </div>
        <button onClick={() => void loadData()} disabled={loading || !poolId} className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        Administrative changes are recorded in the audit log. Students retain the existing same-section and team-freeze restrictions. Project-linked and cross-pool academic reassignment cases remain protected.
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Assigned pool</label>
        <select value={poolId} onChange={e => setPoolId(e.target.value)} className="w-full max-w-xl rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          {pools.map(pool => <option key={pool.id} value={pool.id}>{pool.name} {pool.academicYear ? `• ${pool.academicYear}` : ''} {pool.semester ? `• ${pool.semester}` : ''}</option>)}
        </select>
        {!pools.length && <p className="mt-2 text-sm text-slate-500">No pools are assigned to your Subadmin account.</p>}
      </section>

      {poolId && <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-amber-600" /><h2 className="text-lg font-bold text-slate-900 dark:text-white">Create a team</h2></div>
          <label className="mb-1 block text-sm font-medium">Team name</label>
          <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Team Alpha" className="mb-4 w-full rounded-xl border p-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, enrollment, section..." className="min-w-0 flex-1 rounded-xl border p-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
            <span className="self-center text-xs text-slate-500">{selectedStudents.length} selected</span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-xl border dark:border-slate-700">
            {filteredStudents.map(student => <label key={student.id} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
              <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudent(student.id)} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{fullName(student)}</span><span className="text-xs text-slate-500">{student.enrollmentNo || student.email} · {student.section || 'No section'}</span></span>
            </label>)}
            {!filteredStudents.length && <p className="p-4 text-sm text-slate-500">No students match this search.</p>}
          </div>
          <label className="mb-1 mt-4 block text-sm font-medium">Team leader</label>
          <select value={leaderId} onChange={e => setLeaderId(e.target.value)} className="w-full rounded-xl border p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="">Select leader from selected students</option>
            {eligibleForCreation.map(s => <option key={s.id} value={s.id}>{fullName(s)} · {s.section || 'No section'}</option>)}
          </select>
          <label className="mb-1 mt-4 block text-sm font-medium">Reason for administrative change (required)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Record why this team is being created or modified (minimum 10 characters)." className="w-full rounded-xl border p-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
          <button disabled={busy || !teamName.trim() || !leaderId || selectedStudents.length === 0} onClick={() => void mutate(() => teamService.adminCreateTeam(poolId, { name: teamName, studentIds: selectedStudents, leaderId, reason }))} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"><Users className="h-4 w-4" /> Create team with selected students</button>
          <p className="mt-2 text-xs text-slate-500">Students from different sections can be selected together. Pool eligibility and configured team-size limits still apply.</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900 dark:text-white">Existing teams</h2><span className="text-xs text-slate-500">{teams.length} teams</span></div>
          {loading ? <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Loading teams...</div> : teams.map(team => {
            const available = students.filter(s => !team.members.some(m => m.studentId === s.id));
            return <article key={team.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="font-bold text-slate-900 dark:text-white">{team.name}</h3><p className="text-xs text-slate-500">{team.project?.title || 'No project selected'} · {team.status}{team.isFrozen ? ' · Frozen' : ''}</p></div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{team.members.length} members</span>
              </div>
              <div className="my-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                <label htmlFor={`team-reason-${team.id}`} className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Reason for changes to this team <span className="font-normal text-slate-500">(required, minimum 10 characters)</span></label>
                <textarea id={`team-reason-${team.id}`} value={teamReasons[team.id] || ''} onChange={e => setTeamReasons(old => ({ ...old, [team.id]: e.target.value }))} rows={2} maxLength={1000} placeholder="Explain why you are changing this team's name, members, or leader..." className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
              </div>
              <div className="my-3 flex flex-col gap-2 sm:flex-row"><input value={renameValues[team.id] ?? team.name} onChange={e => setRenameValues(old => ({ ...old, [team.id]: e.target.value }))} className="min-w-0 flex-1 rounded-lg border p-2 text-sm dark:border-slate-700 dark:bg-slate-950" aria-label={`Rename ${team.name}`} /><button disabled={busy || !(renameValues[team.id] ?? team.name).trim() || (renameValues[team.id] ?? team.name).trim() === team.name} onClick={() => void mutate(() => teamService.adminRenameTeam(poolId, team.id, renameValues[team.id] ?? team.name, teamReasons[team.id] || ''), teamReasons[team.id] || '', false)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">Save name</button></div>\n              <div className="my-3 space-y-2">
                {team.members.map(member => <div key={member.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/70">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{fullName(member.student)} {member.studentId === team.leaderId && <Crown className="inline h-3.5 w-3.5 text-amber-500" />}</p><p className="text-xs text-slate-500">{member.student.enrollmentNo || member.student.email} · {member.student.section || 'No section'}</p></div>
                  {member.studentId !== team.leaderId && <button disabled={busy} title="Remove member" onClick={() => void mutate(() => teamService.adminRemoveMember(poolId, team.id, member.studentId, teamReasons[team.id] || ''), teamReasons[team.id] || '', false)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"><UserMinus className="h-4 w-4" /></button>}
                  <button disabled={busy || member.studentId === team.leaderId} title="Make team leader" onClick={() => void mutate(() => teamService.adminSetLeader(poolId, team.id, member.studentId, teamReasons[team.id] || ''), teamReasons[team.id] || '', false)} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:hover:bg-amber-950/40"><Crown className="h-4 w-4" /></button>
                </div>)}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select value={memberSelections[team.id] || ''} onChange={e => setMemberSelections(old => ({ ...old, [team.id]: e.target.value }))} className="min-w-0 flex-1 rounded-lg border p-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Select student to add / transfer</option>
                  {available.filter(s => !team.members.some(m => m.studentId === s.id)).map(s => <option key={s.id} value={s.id}>{fullName(s)} · {s.section || 'No section'}</option>)}
                </select>
                <button disabled={busy || !memberSelections[team.id]} onClick={() => void mutate(() => teamService.adminAddMember(poolId, team.id, memberSelections[team.id], teamReasons[team.id] || ''), teamReasons[team.id] || '', false)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-700"><UserPlus className="h-4 w-4" /> Add / transfer</button>
              </div>
              {team.project && <p className="mt-2 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><AlertCircle className="h-3.5 w-3.5" /> Project-linked team membership is protected from direct transfer.</p>}
            </article>;
          })}
          {!loading && teams.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500 dark:border-slate-700"><Users className="mx-auto mb-2 h-7 w-7" />No teams have been created in this pool yet.</div>}
        </section>
      </div>}
    </div>
  </div>;
};

export default SubadminTeamManagementPage;
