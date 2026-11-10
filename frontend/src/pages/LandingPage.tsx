import React from 'react';
import { Link } from 'react-router-dom';
import {
  Vault,
  Lock,
  ArrowRight,
  Scale,
  History,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 text-ink-900 flex flex-col justify-between selection:bg-crimson-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-cream-300 bg-white/80 backdrop-blur-md px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-30 shadow-clean">
        <div className="flex items-center space-x-3">
          <div className="bg-ink-950 text-white p-2.5 rounded-xl shadow-clean">
            <Vault className="h-6 w-6" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-display font-extrabold text-xl text-ink-950 tracking-tight">BalanceVault</span>
            <span className="w-2 h-2 rounded-full bg-crimson-600"></span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-xs font-bold uppercase tracking-wider text-ink-700 hover:text-crimson-600 transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-ink-950 hover:bg-crimson-600 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-clean hover:shadow-crimson"
          >
            Open Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 text-center flex-1 flex flex-col justify-center items-center">
        {/* Challenge Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-cream-300 shadow-clean text-xs font-mono font-semibold text-ink-700 mb-8">
          <span className="w-2 h-2 rounded-full bg-crimson-600"></span>
          <span>SNOVASYS FRESHER HIRING CHALLENGE 2026</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-ink-950 mb-6 max-w-4xl leading-[1.08]">
          Money Movement With a <span className="text-crimson-600 underline decoration-crimson-200 decoration-wavy underline-offset-8">Ledger You Can Prove</span>.
        </h1>

        <p className="text-ink-600 text-base md:text-xl max-w-2xl mb-10 leading-relaxed font-normal">
          An auditable, mathematically balanced account platform featuring append-only ledger immutability, role-based governance, and real-time dependency health monitoring.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-20 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-bold text-sm tracking-wide transition-all shadow-crimson flex items-center justify-center space-x-2.5"
          >
            <span>Start KYC Onboarding</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-cream-200 text-ink-900 border border-cream-300 font-bold text-sm transition-all shadow-clean"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Key Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl w-full">
          {/* Card 1 */}
          <div className="bg-white border border-cream-300 p-8 rounded-2xl shadow-card hover:border-crimson-300 transition-all duration-200 group">
            <div className="bg-cream-100 border border-cream-300 w-12 h-12 rounded-xl flex items-center justify-center text-ink-950 mb-5 group-hover:bg-crimson-50 group-hover:text-crimson-600 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-display font-bold text-ink-950 mb-2">Double-Entry Balancing</h3>
            <p className="text-ink-500 text-sm leading-relaxed">
              Every balance movement creates paired debit and credit entries with strict zero-floor overdraft prevention.
            </p>
            <div className="mt-4 pt-4 border-t border-cream-200 text-xs font-mono text-crimson-700 font-bold">
              ∑ DEBITS = ∑ CREDITS
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-cream-300 p-8 rounded-2xl shadow-card hover:border-crimson-300 transition-all duration-200 group">
            <div className="bg-cream-100 border border-cream-300 w-12 h-12 rounded-xl flex items-center justify-center text-ink-950 mb-5 group-hover:bg-crimson-50 group-hover:text-crimson-600 transition-colors">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-display font-bold text-ink-950 mb-2">Append-Only Audit Trail</h3>
            <p className="text-ink-500 text-sm leading-relaxed">
              PostgreSQL privileges explicitly revoke UPDATE and DELETE commands on audit logs to ensure historical immutability.
            </p>
            <div className="mt-4 pt-4 border-t border-cream-200 text-xs font-mono text-ink-600 font-semibold">
              POSTGRES LEAST-PRIVILEGE
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-cream-300 p-8 rounded-2xl shadow-card hover:border-crimson-300 transition-all duration-200 group">
            <div className="bg-cream-100 border border-cream-300 w-12 h-12 rounded-xl flex items-center justify-center text-ink-950 mb-5 group-hover:bg-crimson-50 group-hover:text-crimson-600 transition-colors">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-display font-bold text-ink-950 mb-2">Role Separation & RBAC</h3>
            <p className="text-ink-500 text-sm leading-relaxed">
              Strict isolation between Super Admin, Compliance Officer, and Account Holder with centralized authorization guards.
            </p>
            <div className="mt-4 pt-4 border-t border-cream-200 text-xs font-mono text-crimson-700 font-bold">
              DENY-BY-DEFAULT POLICY
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cream-300 bg-white py-6 px-6 text-center text-xs text-ink-500 font-mono">
        <p>BalanceVault &bull; Money Movement With a Ledger You Can Prove &bull; Snovasys Challenge 2026</p>
      </footer>
    </div>
  );
};
