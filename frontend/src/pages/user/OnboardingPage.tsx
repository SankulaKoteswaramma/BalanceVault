import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { OnboardingApplication } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Send,
  ArrowLeft,
  Vault,
} from 'lucide-react';

const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  nationalIdNumber: z.string().min(4, 'ID number must be at least 4 digits'),
  employmentStatus: z.enum(['EMPLOYED', 'SELF_EMPLOYED', 'STUDENT', 'RETIRED', 'UNEMPLOYED']),
  annualIncome: z.string().min(1, 'Annual income is required'),
  sourceOfFunds: z.string().min(2, 'Source of funds is required'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [app, setApp] = useState<OnboardingApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const loadOnboarding = async () => {
    try {
      setLoading(true);
      const res = await api.get('/onboarding/me');
      if (res.data.success) {
        setApp(res.data.data);
        if (res.data.data.user?.profile) {
          setValue('fullName', res.data.data.user.profile.fullName || '');
          setValue('address', res.data.data.user.profile.address || '');
          setValue('dateOfBirth', res.data.data.user.profile.dateOfBirth || '');
        }
      }
    } catch (err: any) {
      console.error('Failed to load onboarding info', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnboarding();
  }, []);

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setServerError(null);
      setSuccessMsg(null);
      const res = await api.post('/onboarding/submit', data);
      if (res.data.success) {
        setSuccessMsg('Onboarding application submitted successfully for review.');
        await loadOnboarding();
        await refreshUser();
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to submit onboarding application.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crimson-600"></div>
      </div>
    );
  }

  const status = app?.status || 'REGISTERED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Bar with Back Button & Main Logo */}
      <div className="flex items-center justify-between pb-2 border-b border-cream-300">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-ink-950 hover:text-crimson-600 px-3.5 py-2 rounded-xl bg-white border border-cream-300 shadow-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-crimson-600" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="bg-white border-2 border-black text-black p-1.5 rounded-lg shadow-sm">
            <Vault className="h-4 w-4 text-black" />
          </div>
          <span className="font-display font-extrabold text-sm text-black tracking-tight">BalanceVault</span>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight">
          KYC & Identity Verification Dossier
        </h1>
        <p className="text-ink-600 text-sm mt-1">
          Regulatory compliance onboarding required to provision and unlock account ledgers.
        </p>
      </div>

      {/* State Progress Bar (White/Cream/Black/Red) */}
      <div className="vault-card-static p-6 rounded-3xl">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-ink-950 text-white flex items-center justify-center font-bold text-xs shadow-clean">
              1
            </div>
            <span className="text-xs font-bold text-ink-950 mt-2 font-mono">Registered</span>
          </div>

          <div className={`h-1 flex-1 mx-3 rounded ${status !== 'REGISTERED' ? 'bg-crimson-600' : 'bg-cream-300'}`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                status === 'PENDING_REVIEW'
                  ? 'bg-crimson-600 text-white shadow-crimson animate-pulse'
                  : status === 'APPROVED' || status === 'REJECTED'
                  ? 'bg-ink-950 text-white'
                  : 'bg-cream-200 text-ink-500 border border-cream-300'
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-ink-950 mt-2 font-mono">In Review</span>
          </div>

          <div className={`h-1 flex-1 mx-3 rounded ${status === 'APPROVED' ? 'bg-crimson-600' : 'bg-cream-300'}`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                status === 'APPROVED'
                  ? 'bg-crimson-600 text-white shadow-crimson'
                  : status === 'REJECTED'
                  ? 'bg-crimson-700 text-white'
                  : 'bg-cream-200 text-ink-500 border border-cream-300'
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold text-ink-950 mt-2 font-mono">
              {status === 'REJECTED' ? 'Rejected' : 'Approved'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {status === 'APPROVED' && (
        <div className="p-6 rounded-2xl bg-white border-2 border-crimson-600/30 shadow-card flex items-start space-x-4">
          <div className="bg-crimson-50 text-crimson-600 p-2.5 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-ink-950">Verification Approved by Compliance</h3>
            <p className="text-sm text-ink-600 mt-1">
              Your customer identity has been reviewed and verified. Your operational checking account is active and enabled for double-entry ledger transfers.
            </p>
          </div>
        </div>
      )}

      {status === 'PENDING_REVIEW' && (
        <div className="p-6 rounded-2xl bg-white border border-cream-300 shadow-card flex items-start space-x-4">
          <div className="bg-cream-100 text-crimson-600 p-2.5 rounded-xl border border-cream-300">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-ink-950">Application Pending Compliance Review</h3>
            <p className="text-sm text-ink-600 mt-1">
              Your onboarding documentation has been securely transmitted. A compliance administrator is reviewing your record.
            </p>
          </div>
        </div>
      )}

      {status === 'REJECTED' && (
        <div className="p-6 rounded-2xl bg-white border-2 border-crimson-600/40 shadow-card space-y-3">
          <div className="flex items-center space-x-3 text-crimson-600">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <h3 className="text-base font-display font-bold text-ink-950">KYC Application Rejected</h3>
          </div>
          <div className="bg-crimson-50/60 p-4 rounded-xl border border-crimson-200 text-xs text-ink-800">
            <span className="font-mono font-bold text-crimson-800 uppercase tracking-wider block mb-1">
              Compliance Reviewer Justification:
            </span>
            {app?.reviewNotes || 'Verification could not be confirmed with the provided documentation.'}
          </div>
          <p className="text-xs text-ink-600">
            Please correct your documentation using the form below and resubmit.
          </p>
        </div>
      )}

      {/* Form (Active when not APPROVED or when PENDING_REVIEW) */}
      {status !== 'APPROVED' && status !== 'PENDING_REVIEW' && (
        <div className="vault-card-static p-8 rounded-3xl">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-cream-200">
            <div className="bg-ink-950 text-white p-2 rounded-xl">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-ink-950">Identity & Source of Funds Form</h2>
              <p className="text-xs text-ink-500">All submissions are cryptographically audited and recorded</p>
            </div>
          </div>

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-800 text-xs font-medium">
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-cream-100 border border-cream-300 text-ink-900 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Legal Full Name
                </label>
                <input
                  {...register('fullName')}
                  type="text"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                />
                {errors.fullName && <p className="text-crimson-600 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Date of Birth (YYYY-MM-DD)
                </label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 font-mono"
                />
                {errors.dateOfBirth && <p className="text-crimson-600 text-xs mt-1">{errors.dateOfBirth.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Residential Street Address
                </label>
                <input
                  {...register('address')}
                  type="text"
                  placeholder="123 Financial Way, Suite 400"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                />
                {errors.address && <p className="text-crimson-600 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  National ID / SSN Number (Masked Upon Storage)
                </label>
                <input
                  {...register('nationalIdNumber')}
                  type="password"
                  placeholder="XXX-XX-1234"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 font-mono"
                />
                {errors.nationalIdNumber && (
                  <p className="text-crimson-600 text-xs mt-1">{errors.nationalIdNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Employment Status
                </label>
                <select
                  {...register('employmentStatus')}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                >
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self-Employed</option>
                  <option value="STUDENT">Student</option>
                  <option value="RETIRED">Retired</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                </select>
                {errors.employmentStatus && (
                  <p className="text-crimson-600 text-xs mt-1">{errors.employmentStatus.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Annual Income Range
                </label>
                <select
                  {...register('annualIncome')}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                >
                  <option value="$0 - $25,000">$0 - $25,000</option>
                  <option value="$25,000 - $75,000">$25,000 - $75,000</option>
                  <option value="$75,000 - $150,000">$75,000 - $150,000</option>
                  <option value="$150,000+">$150,000+</option>
                </select>
                {errors.annualIncome && (
                  <p className="text-crimson-600 text-xs mt-1">{errors.annualIncome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Primary Source of Funds
                </label>
                <input
                  {...register('sourceOfFunds')}
                  type="text"
                  placeholder="e.g. Salary, Consulting Revenue"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                />
                {errors.sourceOfFunds && (
                  <p className="text-crimson-600 text-xs mt-1">{errors.sourceOfFunds.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-xl bg-white border-2 border-black hover:bg-cream-100 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 disabled:bg-cream-200 disabled:text-ink-400"
              >
                <Send className="h-4 w-4 text-black" />
                <span className="text-black font-extrabold">{isSubmitting ? 'Submitting Application...' : 'Submit for Compliance Review'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
