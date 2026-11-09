import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Account, AccountStatus } from '../../types';
import { Search, X } from 'lucide-react';

export const AccountManagementPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [modalAccount, setModalAccount] = useState<Account | null>(null);
  const [nextStatus, setNextStatus] = useState<AccountStatus>('SUSPENDED');
  const [reason, setReason] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/accounts/admin/all', { params });
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [statusFilter, search]);

  const handleUpdateStatus = async () => {
    if (!modalAccount || !reason) return;
    try {
      setIsUpdating(true);
      setStatusError(null);

      const res = await api.patch(`/accounts/admin/${modalAccount.id}/status`, {
        status: nextStatus,
        reason,
      });

      if (res.data.success) {
        setModalAccount(null);
        setReason('');
        await fetchAccounts();
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.error || 'Failed to update account status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          System Account & Ledger Oversight
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Inspect provable balances, manage account active statuses, and enforce locks.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search account number or user email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-full md:w-auto"
        >
          <option value="">All Account Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading ledger accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Account Number</th>
                  <th className="px-6 py-4">Account Holder</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Proved Balance</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-white block">{acc.accountNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {acc.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-slate-200 block">
                          {acc.user?.profile?.fullName || 'Anonymous'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{acc.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-300">{acc.accountType}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          acc.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white text-base">
                      ${Number(acc.balance).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {acc.status !== 'CLOSED' && (
                        <button
                          onClick={() => {
                            setModalAccount(acc);
                            setNextStatus(acc.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
                        >
                          {acc.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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

      {/* Status Modal */}
      {modalAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalAccount(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Alter Account Status</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">Account: {modalAccount.accountNumber}</p>

            {statusError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {statusError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Status
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as AccountStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Reason for Status Change (Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Compliance rationale..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAccount(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating || !reason}
                  onClick={handleUpdateStatus}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
                >
                  {isUpdating ? 'Updating...' : 'Commit Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
