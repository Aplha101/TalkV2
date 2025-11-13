import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signUpSchema, SignUpInput } from '@/lib/schemas';
import { validatePasswordStrength } from '@/lib/auth';

interface FormErrors {
  [key: string]: string[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string }>;
  data?: any;
}

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  });

  const password = watch('password');
  const passwordStrength = password ? validatePasswordStrength(password) : null;

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    setServerErrors({});

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Redirect to sign in page with success message
        router.push({
          pathname: '/auth/signin',
          query: { message: 'Account created successfully! Please sign in.' },
        });
      } else {
        // Handle server errors
        if (result.details) {
          const errors: FormErrors = {};
          result.details.forEach((detail) => {
            if (!errors[detail.field]) {
              errors[detail.field] = [];
            }
            errors[detail.field].push(detail.message);
          });
          setServerErrors(errors);
        } else {
          setServerErrors({ general: [result.error || 'Registration failed'] });
        }
      }
    } catch (error) {
      setServerErrors({ general: ['Network error. Please try again.'] });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return 'text-text-muted';
    if (passwordStrength.errors.length === 0) return 'text-success';
    if (passwordStrength.errors.length <= 2) return 'text-warning';
    return 'text-danger';
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    if (passwordStrength.errors.length === 0) return 'Strong password';
    if (passwordStrength.errors.length <= 2) return 'Medium strength';
    return 'Weak password';
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Marketing content */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary to-primary/80 text-white items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Talkie</h1>
          <p className="text-xl mb-8 opacity-90">
            Your new favorite place to connect, chat, and build communities
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">✓</span>
              </div>
              <span>Real-time messaging</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">✓</span>
              </div>
              <span>Voice and video calls</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">✓</span>
              </div>
              <span>Custom servers and channels</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">✓</span>
              </div>
              <span>Rich media sharing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text mb-2">Create Account</h2>
            <p className="text-text-secondary">
              Join Talkie and start connecting with friends
            </p>
          </div>

          {serverErrors.general && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-md">
              {serverErrors.general.map((error, index) => (
                <p key={index} className="text-danger text-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`input w-full ${errors.email || serverErrors.email ? 'input-error' : ''}`}
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
              )}
              {serverErrors.email?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-danger">
                  {error}
                </p>
              ))}
            </div>

            {/* Display Name field */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="Enter your display name"
                className={`input w-full ${errors.displayName || serverErrors.displayName ? 'input-error' : ''}`}
                {...register('displayName')}
                disabled={isLoading}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-danger">{errors.displayName.message}</p>
              )}
              {serverErrors.displayName?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-danger">
                  {error}
                </p>
              ))}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className={`input w-full pr-12 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {password && passwordStrength && (
                <div className="mt-2">
                  <p className={`text-sm ${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </p>
                  {passwordStrength.errors.length > 0 && (
                    <ul className="mt-1 text-xs text-text-muted">
                      {passwordStrength.errors.slice(0, 3).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className={`input w-full pr-12 ${errors.confirmPassword ? 'input-error' : ''}`}
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms and Privacy */}
            <div className="text-sm text-text-muted">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-8 text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}