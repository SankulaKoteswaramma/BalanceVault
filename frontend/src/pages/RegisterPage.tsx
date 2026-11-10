import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Vault, AlertCircle, ArrowRight } from 'lucide-react';

const registerFormSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      setIsSubmitting(true);

      const response = await api.post('/auth/register', data);

      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        navigate('/onboarding');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please check your information.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900 flex items-center justify-center p-6 selection:bg-crimson-600 selection:text-white">
      <div className="max-w-md w-full bg-white border border-cream-300 p-8 sm:p-10 rounded-2xl shadow-elevated">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="bg-ink-950 text-white p-3 rounded-2xl shadow-clean mb-4 hover:bg-crimson-600 transition-colors">
            <Vault className="h-7 w-7" />
          </Link>
          <div className="flex items-center space-x-1.5 mb-1">
            <h2 className="text-2xl font-display font-extrabold text-ink-950 tracking-tight">Create Customer Account</h2>
            <span className="w-2 h-2 rounded-full bg-crimson-600"></span>
          </div>
          <p className="text-ink-500 text-xs font-mono uppercase tracking-wider">Begin Identity Verification</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-crimson-50 border border-crimson-200 flex items-start space-x-3 text-crimson-800 text-xs">
            <AlertCircle className="h-4 w-4 text-crimson-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
              Legal Full Name
            </label>
            <input
              {...register('fullName')}
              type="text"
              placeholder="e.g. Jane Doe"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 transition-all"
            />
            {errors.fullName && (
              <p className="text-crimson-600 text-xs mt-1.5 font-medium">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="jane@example.com"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 transition-all font-mono"
            />
            {errors.email && (
              <p className="text-crimson-600 text-xs mt-1.5 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              {...register('phoneNumber')}
              type="tel"
              placeholder="+1 555-0199"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 transition-all font-mono"
            />
            {errors.phoneNumber && (
              <p className="text-crimson-600 text-xs mt-1.5 font-medium">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••••••"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 transition-all font-mono"
            />
            {errors.password && (
              <p className="text-crimson-600 text-xs mt-1.5 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              {...register('passwordConfirmation')}
              type="password"
              placeholder="••••••••••••"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 placeholder-ink-400 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600 transition-all font-mono"
            />
            {errors.passwordConfirmation && (
              <p className="text-crimson-600 text-xs mt-1.5 font-medium">{errors.passwordConfirmation.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-3.5 rounded-xl bg-crimson-600 hover:bg-crimson-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-crimson flex items-center justify-center space-x-2"
          >
            <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cream-200 text-center text-xs text-ink-600">
          <span>Already registered? </span>
          <Link to="/login" className="text-crimson-600 hover:text-crimson-700 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
