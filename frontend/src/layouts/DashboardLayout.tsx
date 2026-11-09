import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  UserCheck,
  CreditCard,
  Users,
  FileText,
  LogOut,
  User,
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const userNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Onboarding Status', path: '/onboarding', icon: UserCheck },
    { label: 'My Accounts', path: '/accounts', icon: CreditCard },
  ];

  const adminNavItems = [
    { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Onboarding Review', path: '/admin/onboarding', icon: UserCheck },
    { label: 'Accounts & Ledgers', path: '/admin/accounts', icon: CreditCard },
    { label: 'Audit Trail', path: '/admin/audit', icon: FileText },
  ];

  const currentNav = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 hidden md:flex">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 px-2 py-4 mb-6">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-wide">BalanceVault</span>
              <span className="block text-[10px] text-slate-400 font-mono tracking-tighter">FINANCIAL INTEGRITY</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center space-x-3 px-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-slate-700">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.profile?.fullName || user?.email}
              </p>
              <div className="flex items-center space-x-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-950/50 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Environment: {isAdmin ? 'Compliance & Administrative' : 'Customer Account'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-400 font-mono">
              ID: {user?.id.slice(0, 8)}...
            </span>
            <button
              onClick={() => logout()}
              className="md:hidden text-xs text-rose-400 font-medium"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-6 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
};
