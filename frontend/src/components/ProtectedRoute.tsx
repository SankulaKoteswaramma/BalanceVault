import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crimson-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If ordinary user attempts admin route, redirect to customer dashboard
    if (user.role === 'ACCOUNT_HOLDER') {
      return <Navigate to="/dashboard" replace />;
    }
    // If admin attempts customer dashboard, redirect to admin portal
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
