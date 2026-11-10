import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Vault, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      setIsSubmitting(true);

      const response = await api.post('/auth/login', data);

      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);

        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-ink-900 flex flex-col items-center justify-center p-6 selection:bg-crimson-600 selection:text-white">
      <div className="max-w-md w-full mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-ink-950 hover:text-crimson-600 px-3.5 py-2 rounded-xl bg-white border border-cream-300 shadow-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-crimson-600" />
          <span>Back to Home</span>
        </button>

        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-white border-2 border-black text-black p-1.5 rounded-lg shadow-sm">
            <Vault className="h-4 w-4 text-black" />
          </div>
          <span className="font-display font-extrabold text-sm text-black tracking-tight">BalanceVault</span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white border border-cream-300/90 p-8 sm:p-10 rounded-3xl shadow-elevated hover:shadow-2xl hover:border-crimson-600/30 transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="bg-white border-2 border-black text-black p-3.5 rounded-2xl shadow-sm mb-4 hover:bg-cream-100 transition-colors">
            <Vault className="h-8 w-8 text-black" />
          </Link>
          <div className="flex items-center space-x-1.5 mb-1">
            <h2 className="text-2xl font-display font-extrabold text-ink-950 tracking-tight">Sign in to BalanceVault</h2>
            <span className="w-2 h-2 rounded-full bg-crimson-600"></span>
          </div>
          <p className="text-ink-500 text-xs font-mono uppercase tracking-wider">Provable Financial Management</p>
        </div>

        {/* Error Alert */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-crimson-50 border border-crimson-200 flex items-start space-x-3 text-crimson-800 text-xs">
            <AlertCircle className="h-4 w-4 text-crimson-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 transition-all font-mono"
            />
            {errors.email && (
              <p className="text-crimson-600 text-xs mt-1.5 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 transition-all font-mono"
            />
            {errors.password && (
              <p className="text-crimson-600 text-xs mt-1.5 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-3.5 rounded-xl bg-white border-2 border-black hover:bg-cream-100 text-black font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 disabled:bg-cream-200 disabled:text-ink-400"
          >
            <span className="text-black font-extrabold">{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            {!isSubmitting && <ArrowRight className="h-4 w-4 text-black" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cream-200 text-center text-xs text-ink-600">
          <span>Need a new account? </span>
          <Link to="/register" className="text-crimson-600 hover:text-crimson-700 font-bold hover:underline">
            Register as an Account Holder
          </Link>
        </div>
      </div>
    </div>
  );
};
