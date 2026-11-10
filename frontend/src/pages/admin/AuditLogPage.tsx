import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  X,
  Lock,
  ArrowLeft,
  Vault,
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [targetFilter, setTargetFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (targetFilter) params.targetEntity = targetFilter;

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Bar with Back Button & Main Logo */}
      <div className="flex items-center justify-between pb-2 border-b border-cream-300">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-ink-950 hover:text-crimson-600 px-3.5 py-2 rounded-xl bg-white border border-cream-300 shadow-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-crimson-600" />
          <span>Back to Command Overview</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="bg-white border-2 border-black text-black p-1.5 rounded-lg shadow-sm">
            <Vault className="h-4 w-4 text-black" />
          </div>
          <span className="font-display font-extrabold text-sm text-black tracking-tight">BalanceVault</span>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight flex items-center space-x-3">
            <Lock className="h-7 w-7 text-crimson-600" />
            <span>Append-Only Immutable Audit Trail</span>
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            System-level, tamper-resistant record of security, authentication, and ledger events.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-ink-950 bg-cream-100 px-3.5 py-2 rounded-xl border border-cream-300 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-crimson-600" />
          <span>PostgreSQL: INSERT & SELECT ONLY</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="vault-card-static p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Filter by action (e.g. LOGIN, BOOTSTRAP, USER)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-xs text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
          />
        </div>

        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          className="bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-ink-900 focus:outline-none focus:border-crimson-600 w-full md:w-auto"
        >
          <option value="">All Target Entities</option>
          <option value="User">User</option>
          <option value="OnboardingApplication">OnboardingApplication</option>
          <option value="Account">Account</option>
          <option value="Transaction">Transaction</option>
          <option value="System">System</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="vault-card-static rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-ink-400 font-mono text-xs">Loading audit events...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-ink-500 font-mono text-xs">No audit logs matching query</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-800">
              <thead className="bg-cream-100 border-b border-cream-300 text-xs uppercase font-mono font-bold text-ink-600">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Outcome</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-ink-950 block">{log.action}</span>
                      <span className="text-[10px] text-ink-500">Trace: {log.correlationId || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-ink-950 font-semibold block">{log.actor?.email || log.actorId || 'SYSTEM'}</span>
                        <span className="text-[10px] text-crimson-700 font-bold">{log.actorRole || 'UNAUTHENTICATED'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-ink-800 font-semibold">{log.targetEntity}</span>
                      <span className="text-[10px] text-ink-500 block truncate max-w-[120px]">{log.targetId}</span>
                    </td>
                    <td className="px-6 py-4 text-ink-600 font-sans text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          log.outcome === 'SUCCESS'
                            ? 'bg-cream-100 text-ink-950 border-cream-300'
                            : 'bg-crimson-600 text-white border-crimson-700'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-ink-950 hover:bg-crimson-600 text-white font-sans transition-colors shadow-sm"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-cream-300 rounded-3xl max-w-xl w-full p-8 shadow-elevated relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-6 right-6 text-ink-400 hover:text-ink-950"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-display font-bold text-ink-950 mb-1 font-mono">{selectedLog.action}</h3>
            <p className="text-xs text-ink-500 mb-6 font-mono">Event ID: {selectedLog.id}</p>

            <div className="bg-cream-50 p-5 rounded-2xl border border-cream-300 text-xs space-y-2 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-ink-500">Actor ID:</span>
                <span className="text-ink-950 font-bold">{selectedLog.actorId || 'SYSTEM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Actor Role:</span>
                <span className="text-crimson-700 font-bold">{selectedLog.actorRole || 'NONE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">IP Address:</span>
                <span className="text-ink-950">{selectedLog.ipAddress || 'unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Correlation ID:</span>
                <span className="text-ink-950">{selectedLog.correlationId || 'none'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Timestamp:</span>
                <span className="text-ink-950">{selectedLog.createdAt}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider block mb-2">
                Sanitized Metadata Payload (PII Redacted)
              </span>
              <pre className="bg-cream-100 border border-cream-300 p-4 rounded-2xl text-xs font-mono text-ink-950 overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.metadata, null, 2) || 'null'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
