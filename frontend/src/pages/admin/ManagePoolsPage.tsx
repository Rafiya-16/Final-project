// frontend/src/pages/admin/ManagePoolsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { userService } from '@/services/userService';
import { Plus, FolderKanban, ChevronRight, Calendar } from 'lucide-react';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import type { Pool, User, CreatePoolInput } from '@/types';
import { getErrorMessage } from '@/types';

const ManagePoolsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = async () => { setLoading(true); try { const r = await poolService.list(); setPools(r.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  if (showCreate) return <CreatePoolForm onBack={() => { setShowCreate(false); load(); }} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Allocation Pools</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Create Pool</button>
      </div>

      {loading ? <LoadingSpinner /> : pools.length === 0 ? <EmptyState title="No pools" subtitle="Create your first allocation pool" /> : (
        <div className="grid gap-4">
          {pools.map(pool => (
            <div key={pool.id} onClick={() => navigate(`/pools/${pool.id}`)} className="bg-white rounded-xl border p-5 hover:shadow-md cursor-pointer transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg"><FolderKanban className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pool.name}</h3>
                    <p className="text-sm text-gray-500">{pool.academicYear} • {pool.semester} {pool.department ? `• ${pool.department}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm text-gray-500">
                    <p>{pool._count?.faculty || 0} Faculty • {pool._count?.students || 0} Students</p>
                    <p>{pool._count?.projects || 0} Projects • {pool._count?.teams || 0} Teams</p>
                  </div>
                  <Badge text={pool.status} />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── ACADEMIC YEAR PICKER ──
// Calendar-style dropdown for selecting an academic year range (e.g. "2026-2027")
// instead of free-text input.
const AcademicYearPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  // Shows a range: 3 years back to 5 years ahead of the current year
  const years = Array.from({ length: 9 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none flex items-center justify-between focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || 'Select academic year'}</span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {years.map(y => {
              const range = `${y}-${y + 1}`;
              const active = range === value;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => { onChange(range); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${active ? 'bg-blue-100 font-medium text-blue-700' : ''}`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── CREATE POOL ──
interface CreatePoolFormState {
  name: string;
  academicYear: string;
  semester: string;
  department: string;
  submissionStart: string;
  submissionEnd: string;
  reviewStart: string;
  reviewEnd: string;
  decisionDeadline: string;
  selectionStart: string;
  selectionEnd: string;
  teamFreezeDate: string;
  subadminIds: string[];
  facultyIds: string[];
  studentIds: string[];
}

const CreatePoolForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [form, setForm] = useState<CreatePoolFormState>({
    name: '', academicYear: '2026-2027', semester: 'odd', department: 'CSE',
    submissionStart: '', submissionEnd: '', reviewStart: '', reviewEnd: '',
    decisionDeadline: '', selectionStart: '', selectionEnd: '', teamFreezeDate: '',
    subadminIds: [], facultyIds: [], studentIds: [],
  });
  const [users, setUsers] = useState<{ subadmins: User[]; faculty: User[]; students: User[] }>({ subadmins: [], faculty: [], students: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      userService.list({ role: 'SUBADMIN', limit: '100', isActive: 'true' }),
      userService.list({ role: 'FACULTY', limit: '100', isActive: 'true' }),
      userService.list({ role: 'STUDENT', limit: '500', isActive: 'true' }),
    ]).then(([s, f, st]) => setUsers({ subadmins: s.data, faculty: f.data, students: st.data }));
  }, []);

  const set = (k: keyof CreatePoolFormState, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (list: 'subadminIds' | 'facultyIds' | 'studentIds', id: string) => {
    setForm(f => {
      const arr = f[list];
      return { ...f, [list]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };
  const selectAll = (list: 'subadminIds' | 'facultyIds' | 'studentIds', ids: string[]) => setForm(f => ({ ...f, [list]: ids }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const data: CreatePoolInput = {
        ...form,
        submissionStart: new Date(form.submissionStart).toISOString(),
        submissionEnd: new Date(form.submissionEnd).toISOString(),
        reviewStart: new Date(form.reviewStart).toISOString(),
        reviewEnd: new Date(form.reviewEnd).toISOString(),
        decisionDeadline: new Date(form.decisionDeadline).toISOString(),
        selectionStart: new Date(form.selectionStart).toISOString(),
        selectionEnd: new Date(form.selectionEnd).toISOString(),
        teamFreezeDate: new Date(form.teamFreezeDate).toISOString(),
      };
      await poolService.create(data);
      toast.success('Pool created!'); onBack();
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const dateFields: { key: keyof CreatePoolFormState; label: string }[] = [
    { key: 'submissionStart', label: 'Submission Start' }, { key: 'submissionEnd', label: 'Submission End' },
    { key: 'reviewStart', label: 'Review Start' }, { key: 'reviewEnd', label: 'Review End' },
    { key: 'decisionDeadline', label: 'Decision Deadline' }, { key: 'selectionStart', label: 'Selection Start' },
    { key: 'selectionEnd', label: 'Selection End' }, { key: 'teamFreezeDate', label: 'Team Freeze' },
  ];

  const userSections: { key: 'subadminIds' | 'facultyIds' | 'studentIds'; label: string; items: User[]; display: (u: User) => string }[] = [
    { key: 'subadminIds', label: 'Subadmins', items: users.subadmins, display: (u: User) => `${u.firstName} ${u.lastName} (${u.email})` },
    { key: 'facultyIds', label: 'Faculty', items: users.faculty, display: (u: User) => `${u.firstName} ${u.lastName}` },
    { key: 'studentIds', label: 'Students', items: users.students, display: (u: User) => `${u.firstName} ${u.lastName} (${u.enrollmentNo || ''})` },
  ];

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create Pool</h2>
        <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Basic Info</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3"><label className="text-sm font-medium">Pool Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="PCS 2026 Odd" /></div>
          <div>
            <label className="text-sm font-medium">Academic Year</label>
            <AcademicYearPicker value={form.academicYear} onChange={v => set('academicYear', v)} />
          </div>
          <div><label className="text-sm font-medium">Semester</label><select value={form.semester} onChange={e => set('semester', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none"><option>Odd</option><option>Even</option></select></div>
          <div><label className="text-sm font-medium">Department</label><input value={form.department} onChange={e => set('department', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Timeline</h3>
        <div className="grid grid-cols-2 gap-4">
          {dateFields.map(({ key, label }) => (
            <div key={key}><label className="text-sm font-medium">{label} *</label><input type="datetime-local" value={form[key] as string} onChange={e => set(key, e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          ))}
        </div>
      </div>

      {userSections.map(({ key, label, items, display }) => (
        <div key={key} className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{label} ({form[key].length}/{items.length})</h3>
            <button type="button" onClick={() => selectAll(key, items.map(i => i.id))} className="text-xs text-blue-600 hover:text-blue-800">Select All</button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
            {items.map((u: User) => (
              <label key={u.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${form[key].includes(u.id) ? 'bg-blue-50' : ''}`}>
                <input type="checkbox" checked={form[key].includes(u.id)} onChange={() => toggle(key, u.id)} className="rounded" />
                <span className="text-sm">{display(u)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300">
        {loading ? 'Creating...' : 'Create Pool'}
      </button>
    </form>
  );
};

export default ManagePoolsPage;
