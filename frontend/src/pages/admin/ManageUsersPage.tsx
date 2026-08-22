// frontend/src/pages/admin/ManageUsersPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/userService';
import { Search, Filter, Upload, UserPlus, MoreVertical, ShieldOff, Shield, KeyRound, ChevronLeft, ChevronRight, Download, FileText, Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, Copy } from 'lucide-react';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import type { User, Pagination, ImportResult, CreatedUserResult, CreateUserInput } from '@/types';
import { getErrorMessage } from '@/types';

const ManageUsersPage: React.FC = () => {
  const [tab, setTab] = useState<'list' | 'import' | 'create'>('list');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex gap-2">
          {(['list', 'import', 'create'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {t === 'list' ? 'All Users' : t === 'import' ? 'Bulk Import' : 'Create User'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'list' && <UsersList />}
      {tab === 'import' && <BulkImport />}
      {tab === 'create' && <CreateUser onCreated={() => setTab('list')} />}
    </div>
  );
};

// ── USERS LIST ──
const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userService.list(params);
      setUsers(res.data); setPagination(res.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const toggleStatus = async (id: string) => { await userService.toggleStatus(id); load(); setMenuId(null); toast.success('Status updated'); };
  const resetPwd = async (id: string) => {
    const res = await userService.resetPassword(id);
    navigator.clipboard.writeText(res.tempPassword);
    toast.success(`Password reset: ${res.tempPassword} (copied)`);
    setMenuId(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, enrollment..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="FACULTY">Faculty</option>
          <option value="SUBADMIN">Subadmins</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? <LoadingSpinner /> : users.length === 0 ? <EmptyState title="No users found" /> : (
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                  </td>
                  <td className="px-4 py-3"><Badge text={u.role} /></td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{u.enrollmentNo || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />{u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    <button onClick={() => setMenuId(menuId === u.id ? null : u.id)} className="p-1.5 rounded hover:bg-gray-100"><MoreVertical className="w-4 h-4 text-gray-500" /></button>
                    {menuId === u.id && (
                      <div className="absolute right-4 top-12 bg-white border rounded-lg shadow-lg z-10 w-44 py-1">
                        <button onClick={() => toggleStatus(u.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                          {u.isActive ? <><ShieldOff className="w-4 h-4 text-red-500" />Deactivate</> : <><Shield className="w-4 h-4 text-green-500" />Activate</>}
                        </button>
                        <button onClick={() => resetPwd(u.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                          <KeyRound className="w-4 h-4 text-blue-500" />Reset Password
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="p-1.5 border rounded bg-white disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="p-1.5 border rounded bg-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── BULK IMPORT ──
const BulkImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => { if (f[0]?.name.endsWith('.csv')) { setFile(f[0]); setResult(null); } else toast.error('CSV only'); },
    accept: { 'text/csv': ['.csv'] }, maxFiles: 1,
  });

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const r = await userService.bulkImport(file);
      setResult(r);
      r.status === 'COMPLETED' ? toast.success(`All ${r.successCount} imported!`) : r.status === 'PARTIAL' ? toast(`${r.successCount} ok, ${r.failureCount} failed`, { icon: '⚠️' }) : toast.error('Import failed');
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    finally { setUploading(false); }
  };

  const copyAll = () => {
    if (!result) return;
    const txt = result.results.filter((r: ImportResult['results'][0]) => r.status === 'SUCCESS').map((r: ImportResult['results'][0]) => `${r.email} | ${r.tempPassword}`).join('\n');
    navigator.clipboard.writeText(txt); toast.success('Copied!');
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[{ l: 'Total', v: result.totalRows }, { l: 'Success', v: result.successCount, c: 'text-green-600' }, { l: 'Failed', v: result.failureCount, c: 'text-red-600' }, { l: 'Duplicates', v: result.duplicateCount, c: 'text-yellow-600' }].map(s => (
            <div key={s.l} className="bg-white rounded-xl border p-4 text-center"><p className={`text-3xl font-bold ${s.c || 'text-gray-900'}`}>{s.v}</p><p className="text-sm text-gray-500">{s.l}</p></div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={copyAll} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"><Copy className="w-4 h-4" />Copy Credentials</button>
          <button onClick={() => setShowPwd(!showPwd)} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{showPwd ? 'Hide' : 'Show'} Passwords</button>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs text-gray-500">Row</th><th className="px-4 py-2 text-left text-xs text-gray-500">Status</th><th className="px-4 py-2 text-left text-xs text-gray-500">Email</th><th className="px-4 py-2 text-left text-xs text-gray-500">Password</th><th className="px-4 py-2 text-left text-xs text-gray-500">Error</th></tr></thead>
            <tbody className="divide-y">
              {result.results.map(r => (
                <tr key={r.rowNumber} className={r.status === 'SUCCESS' ? '' : r.status === 'DUPLICATE' ? 'bg-yellow-50' : 'bg-red-50'}>
                  <td className="px-4 py-2 text-gray-500">{r.rowNumber}</td>
                  <td className="px-4 py-2"><Badge text={r.status} /></td>
                  <td className="px-4 py-2 font-mono text-gray-700">{r.email || '—'}</td>
                  <td className="px-4 py-2 font-mono">{r.status === 'SUCCESS' ? (showPwd ? <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded">{r.tempPassword}</span> : '••••••') : '—'}</td>
                  <td className="px-4 py-2 text-red-600 text-xs max-w-xs truncate">{r.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => { setFile(null); setResult(null); setShowPwd(false); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Import Another</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-3">CSV Format</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-xs"><thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">name</th><th className="px-3 py-2 text-left">email</th><th className="px-3 py-2 text-left">enrollment</th><th className="px-3 py-2 text-left">role</th><th className="px-3 py-2 text-left">department</th></tr></thead>
            <tbody><tr className="bg-blue-50"><td className="px-3 py-1.5">Ali Khan</td><td className="px-3 py-1.5 font-mono">ali@iul.ac.in</td><td className="px-3 py-1.5">20BCS001</td><td className="px-3 py-1.5">student</td><td className="px-3 py-1.5">CSE</td></tr>
              <tr className="bg-purple-50"><td className="px-3 py-1.5">Dr Khan</td><td className="px-3 py-1.5 font-mono">khan@iul.ac.in</td><td className="px-3 py-1.5 italic text-gray-400">(empty)</td><td className="px-3 py-1.5">faculty</td><td className="px-3 py-1.5">CSE</td></tr></tbody></table>
        </div>
        <button onClick={() => userService.downloadTemplate()} className="mt-3 flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"><Download className="w-4 h-4" />Download Template</button>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-400 bg-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
          <input {...getInputProps()} />
          {file ? <><FileText className="w-12 h-12 text-green-500 mx-auto mb-2" /><p className="font-medium">{file.name}</p><p className="text-sm text-gray-500">{(file.size/1024).toFixed(1)} KB</p></> :
            <><Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" /><p className="font-medium text-gray-700">{isDragActive ? 'Drop here' : 'Drag & drop CSV'}</p><p className="text-sm text-gray-500">Max 500 rows, 5MB</p></>}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={upload} disabled={!file || uploading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
            {uploading ? <><Loader2 className="w-5 h-5 animate-spin" />Importing...</> : <><Upload className="w-5 h-5" />Import</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── CREATE USER ──
const CreateUser: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'STUDENT', department: 'CSE', enrollmentNo: '', semester: '', section: '', designation: '' });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedUserResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const body: Record<string, unknown> = { ...form, semester: form.semester ? Number(form.semester) : undefined };
      if (form.role !== 'STUDENT') { delete body.enrollmentNo; delete body.semester; delete body.section; }
      if (form.role === 'STUDENT') { delete body.designation; }
      Object.keys(body).forEach(k => { if (body[k] === '') delete body[k]; });
const res = await userService.create(body as unknown as CreateUserInput);      setCreated(res); toast.success('User created!');
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  if (created) {
    return (
      <div className="max-w-lg mx-auto bg-green-50 border border-green-200 rounded-xl p-6">
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-center text-green-800">User Created!</h3>
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="text-gray-500">Email:</span> <span className="font-mono">{created.user.email}</span></p>
          <p><span className="text-gray-500">Password:</span> <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{created.tempPassword}</span></p>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => { navigator.clipboard.writeText(created.tempPassword); toast.success('Copied'); }} className="flex-1 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">Copy Password</button>
          <button onClick={() => setCreated(null)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Create Another</button>
        </div>
      </div>
    );
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={submit} className="max-w-lg mx-auto bg-white rounded-xl border p-6 space-y-4">
      <h2 className="text-lg font-semibold">Create User</h2>
      <div className="grid grid-cols-3 gap-2">
        {(['STUDENT', 'FACULTY', 'SUBADMIN'] as const).map(r => (
          <label key={r} className={`text-center py-2 rounded-lg border-2 cursor-pointer text-sm font-medium ${form.role === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
            <input type="radio" name="role" value={r} checked={form.role === r} onChange={e => set('role', e.target.value)} className="sr-only" />{r}
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-gray-700">First Name *</label><input value={form.firstName} onChange={e => set('firstName', e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-sm font-medium text-gray-700">Last Name *</label><input value={form.lastName} onChange={e => set('lastName', e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
      <div><label className="text-sm font-medium text-gray-700">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
      <div><label className="text-sm font-medium text-gray-700">Department *</label>
        <select value={form.department} onChange={e => set('department', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option><option value="ME">ME</option>
        </select></div>
      {form.role === 'STUDENT' && (
        <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
          <div><label className="text-sm font-medium">Enrollment *</label><input value={form.enrollmentNo} onChange={e => set('enrollmentNo', e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none" /></div>
          <div><label className="text-sm font-medium">Semester</label><input type="number" min={1} max={12} value={form.semester} onChange={e => set('semester', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none" /></div>
          <div><label className="text-sm font-medium">Section</label><input value={form.section} onChange={e => set('section', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none" /></div>
        </div>
      )}
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300">
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
};

export default ManageUsersPage;