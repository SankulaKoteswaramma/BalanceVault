import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface MetricsData {
  metrics: {
    totalUsers: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    activeAccounts: number;
    suspendedAccounts: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    targetEntity: string;
    createdAt: string;
    outcome: string;
  }>;
}

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/admin/metrics');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Administrative & Compliance Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time metrics, onboarding queue, and append-only activity telemetry.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading telemetry metrics...</div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Users
                </span>
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">{data?.metrics.totalUsers || 0}</p>
              <Link to="/admin/users" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block">
                View Directory &rarr;
              </Link>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pending Review
                </span>
                <UserCheck className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-3xl font-extrabold text-amber-400">
                {data?.metrics.pendingApplications || 0}
              </p>
              <Link to="/admin/onboarding" className="text-[11px] text-amber-400 hover:text-amber-300 font-medium mt-2 inline-block">
                Review Applications &rarr;
              </Link>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Accounts
                </span>
                <CreditCard className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">
                {data?.metrics.activeAccounts || 0}
              </p>
              <Link to="/admin/accounts" className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium mt-2 inline-block">
                Manage Ledgers &rarr;
              </Link>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Suspended Accounts
                </span>
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-3xl font-extrabold text-rose-400">
                {data?.metrics.suspendedAccounts || 0}
              </p>
              <span className="text-[11px] text-slate-500 block mt-2">Compliance Locks</span>
            </div>
          </div>

          {/* Recent Audits Table */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                <span>Recent System & Audit Operations</span>
              </h2>
              <Link to="/admin/audit" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1">
                <span>Complete Audit Log</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-800/60">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-200 block font-mono">{log.action}</span>
                      <span className="text-xs text-slate-400">Entity: {log.targetEntity}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.outcome === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {log.outcome}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">No activity recorded yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
