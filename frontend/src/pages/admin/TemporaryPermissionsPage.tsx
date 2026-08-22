import React, { useCallback, useEffect, useState } from 'react';
import { Clock3, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { temporaryPermissionService } from '@/services/temporaryPermissionService';
import { userService } from '@/services/userService';
import type { Permission, TemporaryPermission, User } from '@/types';
import { getErrorMessage } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const PERMISSIONS: Permission[] = ['MANAGE_USERS','MANAGE_POOLS','MANAGE_PROJECTS','APPROVE_PROJECTS','REJECT_PROJECTS','PUBLISH_PROJECTS','ASSIGN_SUPERVISORS','MANAGE_TEAMS','VIEW_REPORTS'];

const TemporaryPermissionsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<TemporaryPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [permission, setPermission] = useState<Permission>('VIEW_REPORTS');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userResult, permissionResult] = await Promise.all([
        userService.list({ limit: '100' }),
        temporaryPermissionService.listAll(),
      ]);
      setUsers((userResult.data || []).filter((u: User) => u.role !== 'ADMIN'));
      setPermissions(permissionResult || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !startsAt || !expiresAt) {
      toast.error('Select a user and provide both dates');
      return;
    }
    const start = new Date(startsAt);
    const expiry = new Date(expiresAt);
    if (start >= expiry) {
      toast.error('Start time must be before expiry time');
      return;
    }
    setSaving(true);
    try {
      await temporaryPermissionService.create({ userId, permission, startsAt: start.toISOString(), expiresAt: expiry.toISOString() });
      toast.success('Temporary permission granted');
      setUserId(''); setStartsAt(''); setExpiresAt('');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await temporaryPermissionService.revoke(id);
      toast.success('Temporary permission revoked');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const formatDate = (value: string) => new Date(value).toLocaleString();
  const isActive = (item: TemporaryPermission) => !item.revokedAt && new Date(item.startsAt) <= new Date() && new Date(item.expiresAt) > new Date();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Temporary Permissions</h1>
        <p className="mt-1 text-sm text-gray-500">Manage the temporary permissions already supported by the backend. Expiration is enforced by backend authorization.</p>
      </div>

      <form onSubmit={create} className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-gray-900"><Plus className="w-5 h-5" /> Grant permission</div>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm text-gray-700">User
            <select value={userId} onChange={e => setUserId(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2">
              <option value="">Select user</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} — {user.role}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-700">Permission
            <select value={permission} onChange={e => setPermission(e.target.value as Permission)} className="mt-1 w-full border rounded-lg px-3 py-2">
              {PERMISSIONS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm text-gray-700">Starts<input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Expires<input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          </div>
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"><ShieldCheck className="w-4 h-4" />{saving ? 'Granting...' : 'Grant Permission'}</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2 font-semibold"><Clock3 className="w-5 h-5" /> Permission history</div>
        {permissions.length === 0 ? <p className="p-6 text-sm text-gray-500">No temporary permissions exist.</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs uppercase text-gray-500">User</th><th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Permission</th><th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Validity</th><th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th><th className="px-4 py-3 text-right text-xs uppercase text-gray-500">Action</th></tr></thead>
              <tbody className="divide-y">
                {permissions.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.user?.firstName} {item.user?.lastName}<div className="text-xs text-gray-500">{item.user?.email} · {item.user?.role}</div></td>
                    <td className="px-4 py-3 text-sm font-mono">{item.permission}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(item.startsAt)}<br />to {formatDate(item.expiresAt)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive(item) ? 'bg-green-100 text-green-700' : item.revokedAt ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{isActive(item) ? 'ACTIVE' : item.revokedAt ? 'REVOKED' : new Date(item.startsAt) > new Date() ? 'SCHEDULED' : 'EXPIRED'}</span></td>
                    <td className="px-4 py-3 text-right">{!item.revokedAt && <button onClick={() => revoke(item.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /> Revoke</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemporaryPermissionsPage;
