import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Role, UserStatus } from '../../types';
import {
  Search,
  X,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<'STATUS' | 'ROLE' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('ACTIVE');
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [reason, setReason] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, roleFilter]);

  const handleUpdateStatus = async () => {
    if (!modalUser || !reason) return;
    try {
      setIsUpdating(true);
      setActionError(null);
      const res = await api.patch(`/admin/users/${modalUser.id}/status`, {
        status: selectedStatus,
        reason,
      });

      if (res.data.success) {
        setModalUser(null);
        setModalAction(null);
        setReason('');
        await fetchUsers();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to update user status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!modalUser || !reason) return;
    try {
      setIsUpdating(true);
      setActionError(null);
      const res = await api.patch(`/admin/users/${modalUser.id}/role`, {
        role: selectedRole,
        reason,
      });

      if (res.data.success) {
        setModalUser(null);
        setModalAction(null);
        setReason('');
        await fetchUsers();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to update user role.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight">
          User Directory & Privilege Governance
        </h1>
        <p className="text-ink-600 text-sm mt-1">
          Review customer profiles, enforce compliance suspensions, and administer administrative roles.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-cream-300 p-4 rounded-2xl shadow-card flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-ink-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink-800 focus:outline-none focus:border-crimson-600 font-mono"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="PENDING">PENDING</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink-800 focus:outline-none focus:border-crimson-600 font-mono"
          >
            <option value="">All Roles</option>
            <option value="ACCOUNT_HOLDER">ACCOUNT_HOLDER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-cream-300 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-ink-400 font-mono text-xs">Loading directory records...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-ink-500 text-xs font-mono">No users matching search filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-800">
              <thead className="bg-cream-100 border-b border-cream-300 text-xs uppercase font-mono font-bold text-ink-600">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Onboarding</th>
                  <th className="px-6 py-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-ink-950 block">{u.profile?.fullName || 'Anonymous'}</span>
                        <span className="text-xs text-ink-500 font-mono">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-cream-100 text-ink-950 border border-cream-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${
                          u.status === 'ACTIVE'
                            ? 'bg-cream-100 text-ink-950 border-cream-300'
                            : u.status === 'SUSPENDED'
                            ? 'bg-crimson-600 text-white border-crimson-700'
                            : 'bg-crimson-50 text-crimson-800 border-crimson-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-ink-600 font-mono font-semibold">
                        {u.onboardingStatus || 'NOT_STARTED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setModalUser(u);
                          setSelectedStatus(u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                          setModalAction('STATUS');
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-cream-100 border border-cream-300 text-ink-950 transition-colors"
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>

                      {isSuperAdmin && u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => {
                            setModalUser(u);
                            setSelectedRole(u.role === 'ADMIN' ? 'ACCOUNT_HOLDER' : 'ADMIN');
                            setModalAction('ROLE');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-crimson-50 hover:bg-crimson-100 border border-crimson-200 text-crimson-800 transition-colors"
                        >
                          Modify Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {modalUser && modalAction && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-cream-300 rounded-3xl max-w-md w-full p-8 shadow-elevated relative">
            <button
              onClick={() => {
                setModalUser(null);
                setModalAction(null);
              }}
              className="absolute top-6 right-6 text-ink-400 hover:text-ink-950"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-display font-bold text-ink-950 mb-1">
              {modalAction === 'STATUS' ? 'Update User Status' : 'Administer User Role'}
            </h3>
            <p className="text-xs text-ink-500 mb-6 font-mono">
              Target User: <strong className="text-ink-950">{modalUser.email}</strong>
            </p>

            {actionError && (
              <div className="mb-4 p-3.5 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-800 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-4">
              {modalAction === 'STATUS' ? (
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                    Target Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 font-mono focus:outline-none focus:border-crimson-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                    Assigned Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 font-mono focus:outline-none focus:border-crimson-600"
                  >
                    <option value="ACCOUNT_HOLDER">ACCOUNT_HOLDER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Administrative Justification (Mandatory for Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Record compliance reason for this state change..."
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 focus:outline-none focus:border-crimson-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => {
                    setModalUser(null);
                    setModalAction(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-cream-200 text-ink-700 hover:bg-cream-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating || !reason}
                  onClick={modalAction === 'STATUS' ? handleUpdateStatus : handleUpdateRole}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-crimson-600 hover:bg-crimson-700 disabled:opacity-50 text-white shadow-crimson"
                >
                  {isUpdating ? 'Saving...' : 'Commit Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
