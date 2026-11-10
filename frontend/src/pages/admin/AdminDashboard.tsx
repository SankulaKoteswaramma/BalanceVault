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
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-cream-300 text-xs font-mono font-semibold text-ink-700 mb-3 shadow-clean">
          <span className="w-2 h-2 rounded-full bg-crimson-600"></span>
          <span>SYSTEM OPERATIONS CONSOLE</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight">
          Compliance & Administrative Telemetry
        </h1>
        <p className="text-ink-600 text-sm mt-1">
          Real-time metrics, onboarding review queues, and tamper-resistant audit telemetry.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-ink-400 font-mono text-xs">Loading telemetry metrics...</div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
                  Registered Users
                </span>
                <Users className="h-4 w-4 text-ink-700" />
              </div>
              <p className="text-3xl font-display font-extrabold text-ink-950">{data?.metrics.totalUsers || 0}</p>
              <Link to="/admin/users" className="text-xs font-bold text-crimson-600 hover:text-crimson-700 hover:underline mt-3 inline-block">
                View Directory &rarr;
              </Link>
            </div>

            <div className="bg-white border-2 border-crimson-200 p-6 rounded-2xl shadow-card bg-gradient-to-br from-white to-crimson-50/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-crimson-800 uppercase tracking-wider font-mono">
                  Pending Review
                </span>
                <UserCheck className="h-4 w-4 text-crimson-600" />
              </div>
              <p className="text-3xl font-display font-extrabold text-crimson-600">
                {data?.metrics.pendingApplications || 0}
              </p>
              <Link to="/admin/onboarding" className="text-xs font-bold text-crimson-700 hover:text-crimson-800 hover:underline mt-3 inline-block font-mono">
                Inspect Queue &rarr;
              </Link>
            </div>

            <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
                  Active Accounts
                </span>
                <CreditCard className="h-4 w-4 text-ink-900" />
              </div>
              <p className="text-3xl font-display font-extrabold text-ink-950">
                {data?.metrics.activeAccounts || 0}
              </p>
              <Link to="/admin/accounts" className="text-xs font-bold text-crimson-600 hover:text-crimson-700 hover:underline mt-3 inline-block">
                Manage Ledgers &rarr;
              </Link>
            </div>

            <div className="bg-white border border-cream-300 p-6 rounded-2xl shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
                  Suspended Accounts
                </span>
                <AlertTriangle className="h-4 w-4 text-crimson-600" />
              </div>
              <p className="text-3xl font-display font-extrabold text-crimson-700">
                {data?.metrics.suspendedAccounts || 0}
              </p>
              <span className="text-xs text-ink-500 block mt-3 font-mono">Compliance Locks Active</span>
            </div>
          </div>

          {/* Recent Audits Table */}
          <div className="bg-white border border-cream-300 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream-200">
              <div className="flex items-center space-x-2.5">
                <div className="bg-ink-950 text-white p-2 rounded-xl">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-ink-950">Recent System Audit Stream</h2>
                  <p className="text-xs text-ink-500">Live immutable event emission stream</p>
                </div>
              </div>
              <Link to="/admin/audit" className="text-xs font-bold uppercase tracking-wider text-crimson-600 hover:text-crimson-700 hover:underline flex items-center space-x-1">
                <span>View Complete Audit Log</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-cream-200">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((log) => (
                  <div key={log.id} className="py-3.5 flex items-center justify-between hover:bg-cream-50/50 px-2 rounded-xl transition-colors">
                    <div>
                      <span className="text-xs font-bold text-ink-950 block font-mono tracking-wide">{log.action}</span>
                      <span className="text-xs text-ink-500">Entity: <strong className="text-ink-800">{log.targetEntity}</strong></span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono uppercase tracking-wider ${
                          log.outcome === 'SUCCESS'
                            ? 'bg-cream-100 text-ink-950 border-cream-300'
                            : 'bg-crimson-50 text-crimson-800 border-crimson-200'
                        }`}
                      >
                        {log.outcome}
                      </span>
                      <span className="text-[10px] text-ink-400 font-mono block mt-1">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-ink-400 text-xs font-mono">No activity records found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
