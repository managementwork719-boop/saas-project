'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LayoutPanelLeft, ChevronRight, AlertCircle } from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      
      if (result?.status === 'password-reset-required' || result === 'password-reset-required') {
          router.push(`/setup-password?email=${email}`);
      } else {
          router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-inter antialiased selection:bg-brand-primary selection:text-white bg-white">
      {/* Left Panel - Dark Social Proof with Aurora Effect */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-950 p-16 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-3 mb-20 group cursor-pointer">
            <div className="w-10 h-10 bg-brand-primary/10 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center p-2 transition-all duration-500 group-hover:scale-110 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
               <LayoutPanelLeft className="text-brand-primary" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">Work<span className="text-brand-primary">Sensy</span></span>
          </div>

          <div className="max-w-md mt-12 pr-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Next-Gen Management</span>
             </div>
            <h1 className="text-6xl font-bold leading-[1.05] mb-8 tracking-tighter">
              Precision <br />
              <span className="premium-gradient-text">Operations.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
              Unified intelligence for high-velocity teams managing complex sales, projects, and workforce.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4 text-slate-500 text-xs font-semibold animate-in fade-in duration-1000 delay-500">
          <div className="flex gap-6 uppercase tracking-widest border-b border-white/5 pb-4 mb-4">
             <span>Security First</span>
             <span>Enterprise Scale</span>
             <span>Real-time Sync</span>
          </div>
          <p>© {new Date().getFullYear()} WorkSensy Ecosystem. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[55%] bg-slate-50 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="glass-card p-10 relative overflow-hidden group bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none opacity-20"></div>

            <div className="text-center mb-10 relative z-10">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Systems Authorization</h2>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] opacity-60">Verified Access Gateway</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 mb-6 text-rose-600 text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl animate-in shake duration-300 flex items-center gap-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Identity Mail
                </label>
                <div className="relative group">
                   <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all duration-300 placeholder-slate-300 text-sm font-bold shadow-sm group-hover:border-slate-300"
                    placeholder="name@organization.app"
                  />
                </div>
              </div>

              <div className="relative space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Access Key
                  </label>
                  <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-brand-hover hover:underline transition-all">
                    Forgot Key?
                  </a>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all duration-300 placeholder-slate-300 text-sm font-bold shadow-sm group-hover:border-slate-300"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-primary focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center px-1 py-1">
                 <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary/30 border-slate-200 rounded-lg cursor-pointer transition-all"
                />
                <label htmlFor="remember" className="ml-3 block text-[12px] font-bold text-slate-500 cursor-pointer select-none">
                  Maintain persistency session
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 px-8 bg-gradient-to-r from-brand-primary to-indigo-600 text-white font-bold uppercase tracking-[0.25em] text-xs rounded-2xl transition-all duration-500 relative overflow-hidden group shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.4)] active:scale-[0.97] ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Core System</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
          
          <div className="text-center px-6">
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">
                Authorized Personnel Only. Access patterns are logged.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
