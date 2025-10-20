'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  // Security: Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('user_type');
    
    // Only redirect if it's a customer token
    if (token && userType === 'customer') {
      router.push('/customer');
    }
  }, [router]);

  // Security: Generate CSRF token
  useEffect(() => {
    const generateCSRFToken = () => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      setCsrfToken(token);
      localStorage.setItem('csrf_token', token);
    };
    generateCSRFToken();
  }, []);

  // Security: Check for lockout
  useEffect(() => {
    const checkLockout = () => {
      const lockoutEnd = localStorage.getItem('login_lockout');
      if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
        setIsLocked(true);
        setLockoutTime(parseInt(lockoutEnd));
      }
    };
    checkLockout();
  }, []);

  // Security: Rate limiting
  const checkRateLimit = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
    const recentAttempts = attempts.filter((time: number) => now - time < 15 * 60 * 1000); // 15 minutes
    
    if (recentAttempts.length >= 5) {
      const lockoutEnd = now + 30 * 60 * 1000; // 30 minutes lockout
      localStorage.setItem('login_lockout', lockoutEnd.toString());
      setIsLocked(true);
      setLockoutTime(lockoutEnd);
      return false;
    }
    return true;
  };

  const recordAttempt = (success: boolean) => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
    
    if (success) {
      // Clear attempts on successful login
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout');
      setAttempts(0);
    } else {
      // Record failed attempt
      attempts.push(now);
      localStorage.setItem('login_attempts', JSON.stringify(attempts));
      setAttempts(attempts.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Check if account is locked
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 60000);
      setError(`Account temporarily locked. Please try again in ${remainingTime} minutes.`);
      return;
    }

    // Security: Check rate limiting
    if (!checkRateLimit()) {
      setError('Too many failed attempts. Account locked for 30 minutes.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Security: Input validation
      if (!email || !password) {
        setError('Please fill in all fields.');
        setIsLoading(false);
        return;
      }

      if (!email.includes('@') || email.length < 5) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password,
          csrf_token: csrfToken,
          user_type: 'customer' // Specify this is a customer login
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Security: Record successful attempt
        recordAttempt(true);
        
        // Store token and user data securely
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('user_type', 'customer');
        localStorage.setItem('login_time', Date.now().toString());
        
        // Clear sensitive data
        setEmail('');
        setPassword('');
        
        // Add a small delay to ensure localStorage is updated before redirect
        setTimeout(() => {
          router.push('/customer');
        }, 100);
      } else {
        // Security: Record failed attempt
        recordAttempt(false);
        
        if (response.status === 429) {
          setError('Too many attempts. Please try again later.');
        } else if (response.status === 401) {
          setError('Invalid email or password.');
        } else if (response.status === 403) {
          setError('Account is disabled. Please contact support.');
        } else {
          setError(data.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      recordAttempt(false);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Secure Customer Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your services and subscriptions
          </p>
          
          {/* Security Indicators */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-1" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center">
              <LockClosedIcon className="h-4 w-4 text-green-500 mr-1" />
              <span>Encrypted</span>
            </div>
          </div>

          {/* Development Notice */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                <div className="text-xs text-yellow-700">
                  <p className="font-medium">Development Mode - Test Accounts</p>
                  <div className="mt-1 space-y-1">
                    <p>• customer@example.com / password</p>
                    <p>• test@customer.com / password</p>
                    <p>• demo@customer.com / password</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Hidden CSRF Token */}
            <input type="hidden" name="csrf_token" value={csrfToken} />
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="/customer/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Security Warnings */}
            {attempts > 0 && attempts < 5 && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <div className="text-sm text-yellow-700">
                    {attempts} failed attempt{attempts > 1 ? 's' : ''}. {5 - attempts} attempt{5 - attempts > 1 ? 's' : ''} remaining before lockout.
                  </div>
                </div>
              </div>
            )}

            {/* Lockout Warning */}
            {isLocked && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <div className="text-sm text-red-700">
                    Account temporarily locked due to multiple failed attempts. 
                    Please try again in {Math.ceil((lockoutTime - Date.now()) / 60000)} minutes.
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !isLocked && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || isLocked}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : isLocked ? (
                  'Account Locked'
                ) : (
                  'Sign in to Customer Portal'
                )}
              </button>
            </div>
          </form>

          {/* Additional Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to our platform?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/customer/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create a customer account
              </a>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Security Notice</p>
              <p className="mt-1">
                This is a secure login portal. All data is encrypted and protected. 
                Failed login attempts are monitored and may result in temporary account lockout.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <a href="/" className="hover:text-gray-900">Home</a>
            <a href="/customer/support" className="hover:text-gray-900">Support</a>
            <a href="/privacy" className="hover:text-gray-900">Privacy</a>
            <a href="/terms" className="hover:text-gray-900">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
