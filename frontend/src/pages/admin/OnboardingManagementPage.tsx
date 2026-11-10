import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { OnboardingApplication } from '../../types';
import {
  X,
  FileCheck2,
  CheckCircle2,
  XCircle,
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
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight flex items-center space-x-3">
          <FileCheck2 className="h-7 w-7 text-crimson-600" />
          <span>KYC & Onboarding Application Queue</span>
        </h1>
        <p className="text-ink-600 text-sm mt-1">
          Review customer onboarding requests, inspect identity data, and provision accounts.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-cream-300 p-4 rounded-2xl shadow-card flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-ink-600 uppercase tracking-wider">
          Filter by Status:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-ink-900 focus:outline-none focus:border-crimson-600"
        >
          <option value="">All Applications</option>
          <option value="PENDING_REVIEW">PENDING_REVIEW (Active Queue)</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-cream-300 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-ink-400 font-mono text-xs">Loading applications queue...</div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-ink-500 font-mono text-xs">No applications found in this queue</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-800">
              <thead className="bg-cream-100 border-b border-cream-300 text-xs uppercase font-mono font-bold text-ink-600">
                <tr>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-ink-950 block">
                          {app.user?.profile?.fullName || 'Anonymous Applicant'}
                        </span>
                        <span className="text-xs text-ink-500 font-mono">{app.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-600 font-mono">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'Not submitted'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${
                          app.status === 'APPROVED'
                            ? 'bg-cream-100 text-ink-950 border-cream-300'
                            : app.status === 'REJECTED'
                            ? 'bg-crimson-600 text-white border-crimson-700'
                            : 'bg-crimson-50 text-crimson-800 border-crimson-200'
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
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson transition-colors"
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
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-cream-300 rounded-3xl max-w-xl w-full p-8 shadow-elevated relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-6 right-6 text-ink-400 hover:text-ink-950"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-display font-bold text-ink-950 mb-1">Compliance Review Dossier</h3>
            <p className="text-xs text-ink-500 mb-6 font-mono">Application ID: {selectedApp.id}</p>

            {reviewError && (
              <div className="mb-4 p-3.5 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-800 text-xs font-mono">
                {reviewError}
              </div>
            )}

            {/* Dossier Data */}
            <div className="bg-cream-50 p-5 rounded-2xl border border-cream-300 text-xs space-y-2.5 mb-6">
              <div className="flex justify-between">
                <span className="text-ink-500 font-mono">Applicant:</span>
                <span className="text-ink-950 font-bold">{selectedApp.user?.profile?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 font-mono">Email:</span>
                <span className="text-ink-950 font-mono">{selectedApp.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 font-mono">Phone:</span>
                <span className="text-ink-950 font-mono">{selectedApp.user?.profile?.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 font-mono">Masked National ID:</span>
                <span className="text-ink-950 font-mono font-bold">{selectedApp.user?.profile?.nationalIdMasked || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 font-mono">Residential Address:</span>
                <span className="text-ink-950">{selectedApp.user?.profile?.address || 'N/A'}</span>
              </div>
              {selectedApp.submittedData && (
                <>
                  <div className="flex justify-between pt-2 border-t border-cream-200">
                    <span className="text-ink-500 font-mono">Employment:</span>
                    <span className="text-ink-950 font-semibold">{selectedApp.submittedData.employmentStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500 font-mono">Annual Income:</span>
                    <span className="text-ink-950 font-semibold">{selectedApp.submittedData.annualIncome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500 font-mono">Source of Funds:</span>
                    <span className="text-ink-950 font-semibold">{selectedApp.submittedData.sourceOfFunds}</span>
                  </div>
                </>
              )}
            </div>

            {/* Decision Controls */}
            {selectedApp.status === 'PENDING_REVIEW' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    Decision
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewDecision('APPROVE');
                        setReviewNotes('Applicant identity and documentation verified.');
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 ${
                        reviewDecision === 'APPROVE'
                          ? 'bg-ink-950 text-white border-ink-950 shadow-md'
                          : 'bg-cream-50 text-ink-600 border-cream-300 hover:bg-cream-100'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-cream-200" />
                      <span>Approve & Provision</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewDecision('REJECT');
                        setReviewNotes('Information mismatch or insufficient identification documentation.');
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 ${
                        reviewDecision === 'REJECT'
                          ? 'bg-crimson-600 text-white border-crimson-700 shadow-crimson'
                          : 'bg-cream-50 text-ink-600 border-cream-300 hover:bg-cream-100'
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject Application</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                    Review Notes (Logged to Audit & Visible on Rejection)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-cream-200">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-cream-200 text-ink-700 hover:bg-cream-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isReviewing || !reviewNotes}
                    onClick={handleReview}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-crimson-600 hover:bg-crimson-700 disabled:opacity-50 text-white shadow-crimson transition-all"
                  >
                    {isReviewing ? 'Saving Review...' : 'Commit Decision'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-cream-100 border border-cream-300 text-xs text-ink-700">
                This application has already been finalized as <span className="text-ink-950 font-bold">{selectedApp.status}</span>.
                {selectedApp.reviewNotes && (
                  <p className="mt-2 text-ink-800">Notes: {selectedApp.reviewNotes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
