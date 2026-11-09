import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  X,
  Lock,
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
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
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Lock className="h-6 w-6 text-indigo-400" />
            <span>Append-Only Immutable Audit Trail</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            System-level, tamper-resistant record of security, authentication, and ledger events.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4" />
          <span>PostgreSQL Permissions: INSERT & SELECT ONLY</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Filter by action (e.g. LOGIN, BOOTSTRAP, USER)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-full md:w-auto"
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
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading audit events...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No audit logs matching query</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Outcome</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-white block">{log.action}</span>
                      <span className="text-[10px] text-slate-500">Trace: {log.correlationId || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-slate-200 block">{log.actor?.email || log.actorId || 'SYSTEM'}</span>
                        <span className="text-[10px] text-indigo-400">{log.actorRole || 'UNAUTHENTICATED'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{log.targetEntity}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">{log.targetId}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-sans text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.outcome === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-sans"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 font-mono">{selectedLog.action}</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">Event ID: {selectedLog.id}</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Actor ID:</span>
                <span className="text-slate-200">{selectedLog.actorId || 'SYSTEM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor Role:</span>
                <span className="text-indigo-400">{selectedLog.actorRole || 'NONE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IP Address:</span>
                <span className="text-slate-200">{selectedLog.ipAddress || 'unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Correlation ID:</span>
                <span className="text-slate-200">{selectedLog.correlationId || 'none'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">{selectedLog.createdAt}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Sanitized Metadata Payload (PII Redacted)
              </span>
              <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.metadata, null, 2) || 'null'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
