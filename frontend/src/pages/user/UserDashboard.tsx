import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Account } from '../../types';
import {
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

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
      {/* Welcome Hero Banner */}
      <div className="bg-white border border-cream-300 p-8 rounded-2xl shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-crimson-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-300 text-xs font-mono font-semibold text-ink-700 mb-3">
            <span className="w-2 h-2 rounded-full bg-crimson-600"></span>
            <span>CUSTOMER OVERVIEW</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight">
            Welcome, {user?.profile?.fullName || user?.email}
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            Status: <span className="font-bold text-ink-950">{user?.status}</span> &bull; Onboarding:{' '}
            <span className="font-bold text-crimson-700">{user?.onboardingStatus?.replace('_', ' ')}</span>
          </p>
        </div>

        {user?.onboardingStatus !== 'APPROVED' && (
          <Link
            to="/onboarding"
            className="px-6 py-3 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-crimson flex items-center space-x-2 relative"
          >
            <span>Complete KYC Verification</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
              Total Proved Balance
            </span>
            <Wallet className="h-5 w-5 text-crimson-600" />
          </div>
          <p className="text-3xl font-display font-extrabold text-ink-950 mt-1">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-4 pt-3 border-t border-cream-200 flex items-center space-x-1.5 text-xs text-ink-600 font-medium">
            <ShieldCheck className="h-4 w-4 text-crimson-600" />
            <span>Double-Entry Verified & Balanced</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
              Active Ledgers
            </span>
            <CreditCard className="h-5 w-5 text-ink-950" />
          </div>
          <p className="text-3xl font-display font-extrabold text-ink-950 mt-1">{accounts.length}</p>
          <div className="mt-4 pt-3 border-t border-cream-200">
            <Link to="/accounts" className="text-xs font-bold text-crimson-600 hover:text-crimson-700 hover:underline inline-flex items-center space-x-1">
              <span>View Ledgers & Transfer</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* KYC Compliance Status */}
        <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
              KYC Status
            </span>
            <ShieldCheck className="h-5 w-5 text-crimson-600" />
          </div>
          <div className="mt-2">
            {user?.onboardingStatus === 'APPROVED' ? (
              <span className="inline-flex items-center space-x-1.5 text-ink-950 font-bold text-base bg-cream-100 px-3 py-1 rounded-lg border border-cream-300">
                <CheckCircle2 className="h-4 w-4 text-crimson-600" />
                <span>Fully Verified</span>
              </span>
            ) : user?.onboardingStatus === 'PENDING_REVIEW' ? (
              <span className="inline-flex items-center space-x-1.5 text-ink-950 font-bold text-base bg-cream-100 px-3 py-1 rounded-lg border border-cream-300">
                <Clock className="h-4 w-4 text-crimson-600" />
                <span>Pending Compliance</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 text-crimson-700 font-bold text-base bg-crimson-50 px-3 py-1 rounded-lg border border-crimson-200">
                <AlertTriangle className="h-4 w-4 text-crimson-600" />
                <span>Action Required</span>
              </span>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-cream-200 text-xs text-ink-500">
            Enables unlimited double-entry ledger transfers
          </div>
        </div>
      </div>

      {/* Quick Accounts Table */}
      <div className="bg-white border border-cream-300 rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream-200">
          <div className="flex items-center space-x-2.5">
            <div className="bg-ink-950 text-white p-2 rounded-xl">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-ink-950">Assigned Account Ledgers</h2>
              <p className="text-xs text-ink-500">Active bank-grade accounts provisioned for this identity</p>
            </div>
          </div>
          <Link
            to="/accounts"
            className="text-xs font-bold uppercase tracking-wider text-crimson-600 hover:text-crimson-700 hover:underline"
          >
            Manage Accounts &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-500 text-xs font-mono">Loading account balances...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-cream-300 rounded-xl bg-cream-50">
            <CreditCard className="h-8 w-8 text-ink-400 mx-auto mb-2" />
            <p className="text-ink-800 text-sm font-bold">No active accounts provisioned yet.</p>
            <p className="text-ink-500 text-xs mt-1">
              Submit your KYC onboarding documents to be provisioned an operational account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cream-200">
            {accounts.map((acc) => (
              <div key={acc.id} className="py-4 flex items-center justify-between hover:bg-cream-50/50 px-2 rounded-xl transition-colors">
                <div>
                  <span className="font-mono text-sm font-bold text-ink-950 block">{acc.accountNumber}</span>
                  <span className="text-xs text-ink-500 uppercase tracking-wider font-semibold">
                    {acc.accountType} &bull; {acc.currency}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-display font-bold text-ink-950 block">
                    ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="inline-block text-[10px] font-bold text-crimson-800 bg-crimson-50 px-2.5 py-0.5 rounded-full border border-crimson-200 mt-1 uppercase tracking-wider font-mono">
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
