import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { projectService } from '@/services/projectService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Play, FastForward, Snowflake, Archive, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Pool, Project, PoolStats } from '@/types';
import { getErrorMessage } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const PoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [pool, setPool] = useState<Pool | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ action: string; title: string; msg: string } | null>(null);
  const [tab, setTab] = useState<'overview' | 'projects' | 'held'>('overview');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, pr, s] = await Promise.all([poolService.getById(id), projectService.listByPool(id), poolService.getStats(id)]);
      setPool(p); setProjects(pr); setStats(s);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const doAction = async (action: string) => {
    if (!id) return;
    try {
      if (action === 'activate') await poolService.activate(id);
      else if (action === 'advance') await poolService.advancePhase(id);
      else if (action === 'freeze') await poolService.freeze(id);
      else if (action === 'archive') await poolService.archive(id);
      else if (action === 'approveAllLocked') await projectService.approveAllLocked(id);
      toast.success('Done!'); load();
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    setConfirm(null);
  };

  const decideProject = async (projectId: string, decision: 'approve' | 'reject') => {
    if (!id) return;
    try {
      if (decision === 'approve') await projectService.approve(id, projectId);
      else await projectService.reject(id, projectId);
      toast.success(`Project ${decision}d`); load();
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  if (loading || !pool) return <LoadingSpinner />;

  const isAdmin = user?.role === 'ADMIN';
  const heldProjects = projects.filter(p => p.status === 'ON_HOLD');
  const tabOptions: ('overview' | 'projects' | 'held')[] = ['overview', 'projects', ...(isAdmin && heldProjects.length ? ['held' as const] : [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/pools')} className="text-sm text-blue-600 hover:text-blue-800 mb-1">← Back to Pools</button>
          <h1 className="text-2xl font-bold">{pool.name}</h1>
          <p className="text-gray-500">{pool.academicYear} • {pool.semester}</p>
        </div>
        <div className="flex items-center gap-3">

  {isAdmin && pool.status === 'DRAFT' && (
    <button
      onClick={() =>
        setConfirm({
          action: 'activate',
          title: 'Activate Pool?',
          msg: 'This will open submissions for faculty.'
        })
      }
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
    >
      <Play className="w-4 h-4" />
      Activate
    </button>
  )}

  {isAdmin &&
    !['DRAFT', 'FROZEN', 'ARCHIVED'].includes(
      pool.status
    ) && (
      <button
        onClick={() =>
          setConfirm({
            action: 'advance',
            title: 'Advance Phase?',
            msg: `Move from ${pool.status} to next phase.`
          })
        }
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <FastForward className="w-4 h-4" />
        Advance
      </button>
    )}

  {isAdmin &&
    !['DRAFT', 'FROZEN', 'ARCHIVED'].includes(
      pool.status
    ) && (
      <button
        onClick={() =>
          setConfirm({
            action: 'freeze',
            title: 'Freeze Pool?',
            msg: 'All teams will be frozen.'
          })
        }
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
      >
        <Snowflake className="w-4 h-4" />
        Freeze
      </button>
    )}

</div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ l: 'Faculty', v: stats.facultyCount }, { l: 'Students', v: stats.studentCount }, { l: 'Projects', v: stats.approvedCount + '/' + stats.projectCount }, { l: 'Teams', v: stats.teamCount }].map(s => (
            <div key={s.l} className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-gray-900">{s.v}</p><p className="text-sm text-gray-500">{s.l}</p></div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {tabOptions.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 px-1 text-sm font-medium border-b-2 ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'held' ? `On Hold (${heldProjects.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Submission', pool.submissionStart, pool.submissionEnd], ['Review', pool.reviewStart, pool.reviewEnd], ['Decision Deadline', pool.decisionDeadline, ''], ['Selection', pool.selectionStart, pool.selectionEnd], ['Team Freeze', pool.teamFreezeDate, '']].map(([l, s, e]) => (
              <div key={l as string} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">{l}</span>
                <span className="font-mono text-gray-800">{new Date(s as string).toLocaleDateString()} {e ? `→ ${new Date(e as string).toLocaleDateString()}` : ''}</span>
              </div>
            ))}
          </div>
          {isAdmin && projects.filter(p => p.status === 'LOCKED').length > 0 && (
            <button onClick={() => setConfirm({ action: 'approveAllLocked', title: 'Approve All Locked?', msg: `This will approve ${projects.filter(p => p.status === 'LOCKED').length} locked projects.` })}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve All Locked ({projects.filter(p => p.status === 'LOCKED').length})</button>
          )}
        </div>
      )}

      {tab === 'projects' && (
        <div className="space-y-3">
          {projects.length === 0 ? <p className="text-gray-500 text-sm bg-white rounded-xl border p-6">No projects yet</p> :
            projects.map(p => (
              <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.domain || 'General'} • {p.faculty?.firstName} {p.faculty?.lastName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge text={p.status} />
                  {p.team && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Team: {p.team.name || 'Assigned'}</span>}
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === 'held' && (
        <div className="space-y-3">
          {heldProjects.map(p => (
            <div key={p.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{p.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">By: {p.faculty?.firstName} {p.faculty?.lastName}</p>
                  <p className="text-sm text-gray-600 mt-2">{p.description}</p>
                  {p.subadminNote && <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mt-2">Subadmin note: {p.subadminNote}</p>}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => decideProject(p.id, 'approve')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><CheckCircle2 className="w-4 h-4" />Approve</button>
                <button onClick={() => decideProject(p.id, 'reject')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><XCircle className="w-4 h-4" />Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && <ConfirmDialog open title={confirm.title} message={confirm.msg} onConfirm={() => doAction(confirm.action)} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

export default PoolDetailPage;