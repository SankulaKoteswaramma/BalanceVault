import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { OnboardingApplication } from '../../types';
import {
  X,
} from 'lucide-react';

export const OnboardingManagementPage: React.FC = () => {
  const [applications, setApplications] = useState<OnboardingApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const [selectedApp, setSelectedApp] = useState<OnboardingApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/onboarding/admin/applications', { params });
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleReview = async () => {
    if (!selectedApp || !reviewNotes) return;
    try {
      setIsReviewing(true);
      setReviewError(null);

      const res = await api.patch(`/onboarding/admin/applications/${selectedApp.id}/review`, {
        decision: reviewDecision,
        notes: reviewNotes,
      });

      if (res.data.success) {
        setSelectedApp(null);
        setReviewNotes('');
        await fetchApplications();
      }
    } catch (err: any) {
      setReviewError(err.response?.data?.error || 'Review failed.');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          KYC & Onboarding Application Queue
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review customer onboarding requests, inspect identity data, and provision accounts.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Filter by Status:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Applications</option>
          <option value="PENDING_REVIEW">PENDING_REVIEW (Active Queue)</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading applications queue...</div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No applications found in this queue</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-white block">
                          {app.user?.profile?.fullName || 'Anonymous Applicant'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{app.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'Not submitted'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setReviewDecision('APPROVE');
                          setReviewNotes('Applicant identity and documentation verified.');
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      >
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Compliance Review Dossier</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">Application ID: {selectedApp.id}</p>

            {reviewError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {reviewError}
              </div>
            )}

            {/* Dossier Data */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Applicant:</span>
                <span className="text-slate-200 font-semibold">{selectedApp.user?.profile?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 font-mono">{selectedApp.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{selectedApp.user?.profile?.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Masked National ID:</span>
                <span className="text-slate-200 font-mono">{selectedApp.user?.profile?.nationalIdMasked || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Residential Address:</span>
                <span className="text-slate-200">{selectedApp.user?.profile?.address || 'N/A'}</span>
              </div>
              {selectedApp.submittedData && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employment:</span>
                    <span className="text-slate-200">{selectedApp.submittedData.employmentStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annual Income:</span>
                    <span className="text-slate-200">{selectedApp.submittedData.annualIncome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source of Funds:</span>
                    <span className="text-slate-200">{selectedApp.submittedData.sourceOfFunds}</span>
                  </div>
                </>
              )}
            </div>

            {/* Decision Controls */}
            {selectedApp.status === 'PENDING_REVIEW' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Decision
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewDecision('APPROVE');
                        setReviewNotes('Applicant identity and documentation verified.');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        reviewDecision === 'APPROVE'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Approve & Provision Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewDecision('REJECT');
                        setReviewNotes('Information mismatch or insufficient identification documentation.');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        reviewDecision === 'REJECT'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Reject Application
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Review Notes (Logged to Audit & Visible on Rejection)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isReviewing || !reviewNotes}
                    onClick={handleReview}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
                  >
                    {isReviewing ? 'Saving Review...' : 'Commit Decision'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                This application has already been finalized as <span className="text-white font-bold">{selectedApp.status}</span>.
                {selectedApp.reviewNotes && (
                  <p className="mt-2 text-slate-300">Notes: {selectedApp.reviewNotes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
