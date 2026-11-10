import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Account, AccountStatus } from '../../types';
import { Search, X, Landmark } from 'lucide-react';

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
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight flex items-center space-x-3">
          <Landmark className="h-7 w-7 text-crimson-600" />
          <span>System Account & Ledger Oversight</span>
        </h1>
        <p className="text-ink-600 text-sm mt-1">
          Inspect provable balances, manage account active statuses, and enforce locks.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-cream-300 p-4 rounded-2xl shadow-card flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-ink-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search account number or user email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-ink-900 focus:outline-none focus:border-crimson-600 w-full md:w-auto"
        >
          <option value="">All Account Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-cream-300 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-ink-400 font-mono text-xs">Loading ledger accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="py-16 text-center text-ink-500 font-mono text-xs">No accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-800">
              <thead className="bg-cream-100 border-b border-cream-300 text-xs uppercase font-mono font-bold text-ink-600">
                <tr>
                  <th className="px-6 py-4">Account Number</th>
                  <th className="px-6 py-4">Account Holder</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Proved Balance</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-ink-950 block">{acc.accountNumber}</span>
                      <span className="text-[10px] text-ink-500 font-mono">ID: {acc.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-ink-950 block">
                          {acc.user?.profile?.fullName || 'Anonymous'}
                        </span>
                        <span className="text-xs text-ink-500 font-mono">{acc.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-ink-700">{acc.accountType}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${
                          acc.status === 'ACTIVE'
                            ? 'bg-cream-100 text-ink-950 border-cream-300'
                            : 'bg-crimson-600 text-white border-crimson-700'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-ink-950 text-base">
                      ${Number(acc.balance).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {acc.status !== 'CLOSED' && (
                        <button
                          onClick={() => {
                            setModalAccount(acc);
                            setNextStatus(acc.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-cream-100 border border-cream-300 text-ink-950 transition-colors shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-cream-300 rounded-3xl max-w-md w-full p-8 shadow-elevated relative">
            <button
              onClick={() => setModalAccount(null)}
              className="absolute top-6 right-6 text-ink-400 hover:text-ink-950"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-display font-bold text-ink-950 mb-1">Alter Account Status</h3>
            <p className="text-xs text-ink-500 mb-4 font-mono">Account: {modalAccount.accountNumber}</p>

            {statusError && (
              <div className="mb-4 p-3.5 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-800 text-xs font-mono">
                {statusError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Target Status
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as AccountStatus)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 font-mono focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Reason for Status Change (Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Compliance rationale..."
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setModalAccount(null)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-cream-200 text-ink-700 hover:bg-cream-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating || !reason}
                  onClick={handleUpdateStatus}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-crimson-600 hover:bg-crimson-700 disabled:opacity-50 text-white shadow-crimson transition-all"
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
