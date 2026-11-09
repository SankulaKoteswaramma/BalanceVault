import React, { useEffect, useState } from 'react';
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const status = app?.status || 'REGISTERED';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Account Verification & KYC Onboarding
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Regulatory identity verification for provisioned financial accounts.
        </p>
      </div>

      {/* State Progress Bar */}
      <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/25">
              1
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-2">Registered</span>
          </div>

          <div className={`h-1 flex-1 mx-2 rounded ${status !== 'REGISTERED' ? 'bg-indigo-600' : 'bg-slate-800'}`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                status === 'PENDING_REVIEW'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : status === 'APPROVED' || status === 'REJECTED'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-2">Review</span>
          </div>

          <div className={`h-1 flex-1 mx-2 rounded ${status === 'APPROVED' ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                status === 'APPROVED'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : status === 'REJECTED'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-2">
              {status === 'REJECTED' ? 'Rejected' : 'Approved'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {status === 'APPROVED' && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-emerald-400">Onboarding Approved</h3>
            <p className="text-sm text-slate-300 mt-1">
              Your identity has been verified by compliance. Your primary checking account is active and enabled for ledger operations.
            </p>
          </div>
        </div>
      )}

      {status === 'PENDING_REVIEW' && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-4">
          <Clock className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-amber-400">Application Under Review</h3>
            <p className="text-sm text-slate-300 mt-1">
              Your onboarding documentation has been securely transmitted. A compliance administrator is reviewing your record.
            </p>
          </div>
        </div>
      )}

      {status === 'REJECTED' && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
          <div className="flex items-center space-x-3 text-rose-400">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <h3 className="text-base font-bold">Onboarding Application Rejected</h3>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-rose-500/20 text-sm text-slate-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block mb-1">
              Compliance Reviewer Notes:
            </span>
            {app?.reviewNotes || 'Verification could not be approved based on the information provided.'}
          </div>
          <p className="text-xs text-slate-400">
            You may correct and resubmit your verification details using the form below.
          </p>
        </div>
      )}

      {/* Form (Active when not APPROVED or when PENDING_REVIEW) */}
      {status !== 'APPROVED' && status !== 'PENDING_REVIEW' && (
        <div className="bg-slate-950 border border-slate-800/80 p-8 rounded-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <FileCheck className="h-6 w-6 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Identity & Financial Profile Form</h2>
          </div>

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Legal Full Name
                </label>
                <input
                  {...register('fullName')}
                  type="text"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.fullName && <p className="text-rose-400 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Date of Birth (YYYY-MM-DD)
                </label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.dateOfBirth && <p className="text-rose-400 text-xs mt-1">{errors.dateOfBirth.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Residential Street Address
                </label>
                <input
                  {...register('address')}
                  type="text"
                  placeholder="123 Financial Way, Suite 400"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.address && <p className="text-rose-400 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  National ID / SSN Number (Stored Masked)
                </label>
                <input
                  {...register('nationalIdNumber')}
                  type="password"
                  placeholder="XXX-XX-1234"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.nationalIdNumber && (
                  <p className="text-rose-400 text-xs mt-1">{errors.nationalIdNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Employment Status
                </label>
                <select
                  {...register('employmentStatus')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self-Employed</option>
                  <option value="STUDENT">Student</option>
                  <option value="RETIRED">Retired</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                </select>
                {errors.employmentStatus && (
                  <p className="text-rose-400 text-xs mt-1">{errors.employmentStatus.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Annual Income Range
                </label>
                <select
                  {...register('annualIncome')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="$0 - $25,000">$0 - $25,000</option>
                  <option value="$25,000 - $75,000">$25,000 - $75,000</option>
                  <option value="$75,000 - $150,000">$75,000 - $150,000</option>
                  <option value="$150,000+">$150,000+</option>
                </select>
                {errors.annualIncome && (
                  <p className="text-rose-400 text-xs mt-1">{errors.annualIncome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Primary Source of Funds
                </label>
                <input
                  {...register('sourceOfFunds')}
                  type="text"
                  placeholder="e.g. Salary, Business Revenue, Savings"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.sourceOfFunds && (
                  <p className="text-rose-400 text-xs mt-1">{errors.sourceOfFunds.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Submitting Application...' : 'Submit for Compliance Review'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
