import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Vault,
  LayoutDashboard,
  UserCheck,
  CreditCard,
  Users,
  FileText,
  LogOut,
  User,
  Shield,
  ArrowLeft,
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const userNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'KYC Onboarding', path: '/onboarding', icon: UserCheck },
    { label: 'My Accounts & Ledger', path: '/accounts', icon: CreditCard },
  ];

  const adminNavItems = [
    { label: 'Command Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'KYC Review Queue', path: '/admin/onboarding', icon: UserCheck },
    { label: 'Accounts & Ledgers', path: '/admin/accounts', icon: CreditCard },
    { label: 'Immutable Audit Trail', path: '/admin/audit', icon: FileText },
  ];

  const currentNav = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-transparent text-ink-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-cream-50/95 border-r border-cream-300 flex flex-col justify-between p-5 hidden md:flex backdrop-blur-md shadow-clean">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 px-2 py-3 mb-8 group">
            <div className="bg-white border-2 border-black text-black p-2 rounded-xl shadow-sm group-hover:bg-cream-100 transition-colors duration-200">
              <Vault className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-extrabold text-lg text-black tracking-tight">BalanceVault</span>
                <span className="w-1.5 h-1.5 rounded-full bg-crimson-600"></span>
              </div>
              <span className="block text-[10px] text-ink-600 font-mono tracking-wider uppercase font-extrabold">
                PROVABLE LEDGER
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-ink-400 uppercase tracking-widest block mb-2 font-mono">
              {isAdmin ? 'Administration' : 'Customer Portal'}
            </span>
            <nav className="space-y-1">
              {currentNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-white text-ink-950 shadow-card border-l-4 border-crimson-600'
                        : 'text-ink-600 hover:text-ink-950 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-crimson-600' : 'text-ink-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="w-1 h-1 rounded-full bg-crimson-600"></span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-cream-300 pt-4 space-y-3">
          <div className="bg-white/90 p-3 rounded-xl border border-cream-300 shadow-clean flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-cream-200 flex items-center justify-center text-ink-800 font-bold text-xs border border-cream-300">
              <User className="h-4 w-4 text-ink-700" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-ink-950 truncate">
                {user?.profile?.fullName || user?.email}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson-600 animate-pulse"></span>
                <span className="text-[10px] text-crimson-700 font-bold uppercase tracking-wider font-mono">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-bold text-ink-950 bg-white hover:text-white hover:bg-crimson-600 rounded-xl transition-all duration-150 border border-cream-300 hover:border-crimson-600 shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-cream-300 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-clean">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cream-50 hover:bg-cream-100 text-ink-950 border border-cream-300 transition-colors shadow-sm"
              title="Go back to previous page"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-crimson-600" />
              <span>Back</span>
            </button>

            <Link to="/" className="flex items-center space-x-2 mr-1 group">
              <div className="bg-white border-2 border-black text-black p-1.5 rounded-lg shadow-sm">
                <Vault className="h-4 w-4 text-black" />
              </div>
              <span className="font-display font-extrabold text-sm text-black tracking-tight hidden sm:inline">
                BalanceVault
              </span>
            </Link>

            <span className="inline-flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full bg-cream-200 text-ink-800 font-medium border border-cream-300">
              <Shield className="h-3.5 w-3.5 text-crimson-600" />
              <span>Scope: <strong className="text-ink-950">{isAdmin ? 'Compliance & Administrative' : 'Customer Account'}</strong></span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-ink-500 bg-cream-100 px-3 py-1 rounded-lg border border-cream-300">
              <span>ACTOR:</span>
              <strong className="text-ink-900">{user?.email}</strong>
            </div>
            <button
              onClick={() => logout()}
              className="md:hidden text-xs font-bold text-crimson-600 hover:underline"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
