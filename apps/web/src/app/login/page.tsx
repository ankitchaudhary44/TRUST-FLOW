'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ArrowRight, Lock, UserPlus } from 'lucide-react';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'CUSTOMER' | 'ANALYST'>('CUSTOMER');
  const [lockedRole, setLockedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // If they have a token but are explicitly navigating to the wrong portal's login, clear it
    if (token && roleParam && userRole && roleParam !== userRole) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    } else if (token) {
      // If already correctly logged in, send them to their dashboard
      if (userRole === 'CUSTOMER') router.push('/transfer');
      else if (userRole === 'ANALYST' || userRole === 'ADMIN') router.push('/analyst');
      return;
    }

    if (roleParam === 'CUSTOMER' || roleParam === 'ANALYST') {
      setRole(roleParam);
      setLockedRole(roleParam);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: isLogin ? undefined : role })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      if (data.accessToken) {
        // Enforce strict portal separation
        if (isLogin && lockedRole && data.user.role !== lockedRole) {
          throw new Error(`This portal is for ${lockedRole === 'CUSTOMER' ? 'Customers' : 'Analysts'}. Please use the correct login page.`);
        }

        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('userRole', data.user.role);
        
        if (data.user.role === 'ANALYST' || data.user.role === 'ADMIN') {
          router.push('/analyst');
        } else {
          router.push('/transfer');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4">
          T
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {isLogin ? (lockedRole === 'ANALYST' ? 'Analyst Portal Login' : 'Sign in to TrustFlow') : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Register now
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => { setIsLogin(true); setError(''); }} className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && !lockedRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am signing up as a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`py-3 px-4 border rounded-xl text-sm font-bold transition-all ${
                      role === 'CUSTOMER' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ANALYST')}
                    className={`py-3 px-4 border rounded-xl text-sm font-bold transition-all ${
                      role === 'ANALYST' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    SOC Analyst
                  </button>
                </div>
              </div>
            )}

            {!isLogin && lockedRole && (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
                <span>Registering as: <strong>{lockedRole === 'ANALYST' ? 'SOC Analyst' : 'Customer'}</strong></span>
                <ShieldCheck className="w-4 h-4 shrink-0" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                {!loading && (isLogin ? <ArrowRight className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-2 text-sm text-blue-800">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600" />
                  Quick Demo Access
                </div>
                {(!lockedRole || lockedRole === 'CUSTOMER') && (
                  <div className="flex justify-between items-center text-xs">
                    <span>Customer:</span>
                    <button type="button" onClick={() => { setEmail('customer@trustflow.local'); setPassword('password123'); }} className="font-mono bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 transition-colors">customer@trustflow.local</button>
                  </div>
                )}
                {(!lockedRole || lockedRole === 'ANALYST') && (
                  <div className="flex justify-between items-center text-xs">
                    <span>Analyst:</span>
                    <button type="button" onClick={() => { setEmail('analyst@trustflow.local'); setPassword('password123'); }} className="font-mono bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 transition-colors">analyst@trustflow.local</button>
                  </div>
                )}
                <p className="text-[10px] text-blue-600/80 mt-1">Password is <b>password123</b></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
