import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Account } from '../../types';
import { ShieldCheck, CreditCard, ArrowUpRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts/my');
        if (res.data.success) {
          setAccounts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load accounts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.profile?.fullName || user?.email}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Account Status: <span className="text-indigo-400 font-semibold">{user?.status}</span> &bull; Onboarding:{' '}
            <span className="text-amber-400 font-semibold">{user?.onboardingStatus?.replace('_', ' ')}</span>
          </p>
        </div>

        {user?.onboardingStatus !== 'APPROVED' && (
          <Link
            to="/onboarding"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <span>Complete Verification</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Proved Balance
          </span>
          <p className="text-3xl font-extrabold text-white">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1 mt-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Audited & Double-Entry Verified</span>
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Active Accounts
          </span>
          <p className="text-3xl font-extrabold text-white">{accounts.length}</p>
          <Link to="/accounts" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block">
            View Accounts & Ledgers &rarr;
          </Link>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Compliance Lifecycle
          </span>
          <div className="flex items-center space-x-2 mt-1">
            {user?.onboardingStatus === 'APPROVED' ? (
              <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Fully Verified</span>
              </span>
            ) : user?.onboardingStatus === 'PENDING_REVIEW' ? (
              <span className="inline-flex items-center space-x-1 text-amber-400 font-bold text-sm">
                <Clock className="h-4 w-4" />
                <span>Pending Review</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-rose-400 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Verification Required</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Required for unlimited ledger transfers</span>
        </div>
      </div>

      {/* Quick Accounts Table */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            <span>Assigned Accounts</span>
          </h2>
          <Link to="/accounts" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            Manage & Transfer
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Loading account ledgers...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-400 text-sm mb-2">No active accounts provisioned yet.</p>
            <p className="text-slate-500 text-xs">
              Complete your onboarding verification above to be provisioned a checked account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {accounts.map((acc) => (
              <div key={acc.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm text-slate-200 block">{acc.accountNumber}</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{acc.accountType} &bull; {acc.currency}</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-white block">
                    ${Number(acc.balance).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {acc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
